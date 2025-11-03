import { useCallback, useEffect, useState } from 'react';
import { ConnectionState, LocalTrackPublication, RoomEvent } from 'livekit-client';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';

export function useAgentMicrophoneControl() {
  const room = useRoomContext();
  const { state: agentState } = useVoiceAssistant();
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canStartRecording, setCanStartRecording] = useState(false);

  // 采用 RPC 控制后端的开始/结束轮次，不再使用数据通道自定义信号

  // 检查麦克风权限
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const permission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      if (permission.state === 'denied') {
        return false;
      }

      // 尝试获取媒体设备
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // 清理
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const isSpeaking = agentState === 'speaking';
    setIsAgentSpeaking(isSpeaking);

    // 根据 agent 状态更新是否可以开始录音
    if (agentState === 'speaking') {
      // Agent 正在说话，不能开始录音，如果正在录音则停止
      setCanStartRecording(false);
      if (isRecording) {
        setIsRecording(false);
        if (room && room.state === ConnectionState.Connected) {
          room.localParticipant.setMicrophoneEnabled(false);
        }
      }
    } else if (agentState === 'listening') {
      // Agent 在监听，可以开始录音
      setCanStartRecording(true);
    } else {
      // 其他状态（如 thinking, initializing, connecting），不能开始录音
      setCanStartRecording(false);
      if (isRecording) {
        setIsRecording(false);
        if (room && room.state === ConnectionState.Connected) {
          room.localParticipant.setMicrophoneEnabled(false);
        }
      }
    }
  }, [agentState, room, isRecording]);

  const getAgentIdentity = useCallback((): string | undefined => {
    if (!room || room.state !== ConnectionState.Connected) return undefined;
    let id: string | undefined;
    // 优先使用带有 isAgent 标记的参与者（如果 SDK 暴露）
    room.remoteParticipants.forEach((p) => {
      if (!id && p.isAgent === true) {
        id = p.identity as string;
      }
    });
    // 退化策略：按 identity 前缀匹配（例如 agent-xxx）
    if (!id) {
      room.remoteParticipants.forEach((p) => {
        if (!id && typeof p.identity === 'string' && p.identity.startsWith('agent-')) {
          id = p.identity;
        }
      });
    }
    return id;
  }, [room]);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (canStartRecording && !isRecording) {
      // 检查麦克风权限
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        return;
      }
      // 确保房间已连接，否则启麦会失败
      if (!room || room.state !== ConnectionState.Connected) {
        console.warn('🎤 Room is not connected; cannot enable microphone');
        return;
      }
      setIsRecording(true);
      try {
        await room.localParticipant.setMicrophoneEnabled(true);

        // 使用动态查询的方式获取 agent identity，避免未初始化的状态变量
        const destIdentity = getAgentIdentity();

        if (destIdentity && room.localParticipant) {
          await room.localParticipant.performRpc({
            destinationIdentity: destIdentity,
            method: 'start_turn',
            payload: '',
          });
        } else {
          console.warn('🎤 Could not resolve agent identity to send start_turn RPC');
        }
      } catch (error) {
        setIsRecording(false);
        console.error('🎤 Failed to enable microphone or send RPC:', error);
      }
    } else {
      console.log(
        '🎤 Cannot start recording - canStartRecording:',
        canStartRecording,
        'isRecording:',
        isRecording
      );
    }
  }, [canStartRecording, isRecording, room, checkMicrophonePermission, getAgentIdentity]);

  // 停止录音
  const stopRecording = useCallback(async () => {
    if (isRecording) {
      console.log('🎤 Stopping recording...');
      setIsRecording(false);
      if (!room || room.state !== ConnectionState.Connected) {
        console.warn('🎤 Room is not connected; skipping microphone disable and RPC');
        return;
      }
      const agentIdentity = getAgentIdentity();
      if (agentIdentity && room.localParticipant) {
        await room.localParticipant.performRpc({
          destinationIdentity: agentIdentity,
          method: 'end_turn',
          payload: '',
        });
      } else {
      }
      room.localParticipant.setMicrophoneEnabled(false);
    }
  }, [isRecording, room, getAgentIdentity]);

  // 切换录音状态
  const toggleRecording = useCallback(() => {
    console.log(
      '🎤 toggleRecording called - isRecording:',
      isRecording,
      'canStartRecording:',
      canStartRecording,
      'agentState:',
      agentState
    );
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording, canStartRecording, agentState]);

  // 监听本地音轨发布/取消发布事件，帮助诊断是否真正上行了音频
  useEffect(() => {
    if (!room) return;
    const onLocalPublished = (pub: LocalTrackPublication) => {
      const kind = pub?.track?.kind ?? pub?.kind;
      if (kind === 'audio') {
        console.log(
          '🎤 Event LocalTrackPublished (audio):',
          pub?.track?.sid ?? pub?.trackSid ?? '[no sid]'
        );
      }
    };
    const onLocalUnpublished = (pub: LocalTrackPublication) => {
      const kind = pub?.track?.kind ?? pub?.kind;
      if (kind === 'audio') {
        console.log(
          '🎤 Event LocalTrackUnpublished (audio):',
          pub?.track?.sid ?? pub?.trackSid ?? '[no sid]'
        );
      }
    };
    room.on(RoomEvent.LocalTrackPublished, onLocalPublished);
    room.on(RoomEvent.LocalTrackUnpublished, onLocalUnpublished);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, onLocalPublished);
      room.off(RoomEvent.LocalTrackUnpublished, onLocalUnpublished);
    };
  }, [room]);

  return {
    isAgentSpeaking,
    isRecording,
    canStartRecording,
    isRoomConnected: room?.state === 'connected',
    agentState,
    startRecording,
    stopRecording,
    toggleRecording,
    // 保持向后兼容
    shouldAllowUserInput: canStartRecording,
  };
}
