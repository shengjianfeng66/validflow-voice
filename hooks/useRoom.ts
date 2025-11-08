import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, TokenSource } from 'livekit-client';
import { AppConfig } from '@/app-config';
import { toastAlert } from '@/components/livekit/alert-toast';

export function useRoom(appConfig: AppConfig) {
  const aborted = useRef(false);
  const room = useMemo(() => new Room(), []);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    function onDisconnected() {
      setIsSessionActive(false);
    }

    function onMediaDevicesError(error: Error) {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    }

    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  useEffect(() => {
    return () => {
      aborted.current = true;
      room.disconnect();
    };
  }, [room]);

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        // 1. 首先调用 /api/v1/interview/list 获取 outline 数据
        let outline = null;
        try {
          const interviewListUrl = new URL('/api/v1/interview/list', window.location.origin);
          const interviewRes = await fetch(interviewListUrl.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (interviewRes.ok) {
            const interviewData = await interviewRes.json();
            outline = interviewData.outline;
            // console.log(outline)
          }
        } catch (error) {
          console.warn('Failed to fetch interview outline:', error);
          // 继续执行，不阻断连接流程
        }

        // 2. 构造 metadata
        const metadata = outline
          ? {
            prompt_params: {
              outline: outline,
            },
          }
          : undefined;

        // 3. 调用 connection-details 接口
        const url = new URL(
          process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
          window.location.origin
        );

        try {
          const roomConfig = {
            ...(appConfig.agentName && {
              agents: [{ agent_name: appConfig.agentName }],
            }),
            ...(metadata && { metadata }),
          };

          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sandbox-Id': appConfig.sandboxId ?? '',
            },
            body: JSON.stringify({
              room_config: Object.keys(roomConfig).length > 0 ? roomConfig : undefined,
            }),
          });
          return await res.json();
        } catch (error) {
          console.error('Error fetching connection details:', error);
          throw new Error('Error fetching connection details!');
        }
      }),
    [appConfig]
  );

  const startSession = useCallback(() => {
    setIsSessionActive(true);

    if (room.state === 'disconnected') {
      const { isPreConnectBufferEnabled } = appConfig;
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(false, undefined, {
          // 默认关闭麦克风
          preConnectBuffer: isPreConnectBufferEnabled,
        }),
        room.localParticipant.setCameraEnabled(true, undefined, {
          // 默认开启摄像头
          preConnectBuffer: isPreConnectBufferEnabled,
        }),
        tokenSource
          .fetch({ agentName: appConfig.agentName })
          .then((connectionDetails) =>
            room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
          ),
      ]).catch((error) => {
        if (aborted.current) {
          // Once the effect has cleaned up after itself, drop any errors
          //
          // These errors are likely caused by this effect rerunning rapidly,
          // resulting in a previous run `disconnect` running in parallel with
          // a current run `connect`
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
  }, [room, appConfig, tokenSource]);

  const endSession = useCallback(() => {
    setIsSessionActive(false);
    room.disconnect(); // 断开房间连接
  }, [room]);

  return {
    room,
    isSessionActive,
    startSession,
    endSession,
  };
}
