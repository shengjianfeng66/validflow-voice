'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useAgentMicrophoneControl } from '@/hooks/useAgentMicrophoneControl';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { useInterviewStore } from '@/store/interview-store';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}
interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const router = useRouter();
  const { isAgentSpeaking, shouldAllowUserInput } = useAgentMicrophoneControl();
  const messages = useChatMessages();
  const { intervieweeId, responseId, clearInterviewIds } = useInterviewStore();
  const { localParticipant } = useLocalParticipant();
  const [chatOpen, setChatOpen] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const participants = useRemoteParticipants();

  // 参考 getAgentIdentity 逻辑：判断 Agent 是否已入会
  const isAgentJoined =
    participants.some((p) => p.isAgent === true) ||
    participants.some((p) => typeof p.identity === 'string' && p.identity.startsWith('agent-'));

  const controls: ControlBarControls = {
    leave: true,
    microphone: shouldAllowUserInput, // 根据 agent 状态控制麦克风
    // 如果 Agent 未入会，则不显示聊天输入
    chat: false, // 隐藏文本输入按钮
    camera: appConfig.supportsVideoInput,
    screenShare: false, // 隐藏屏幕共享按钮
    transcript: false, // 隐藏聊天记录切换按钮
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDisconnect = async () => {
    console.log('🔴 开始处理断开连接...');
    try {
      // 先关闭麦克风和摄像头（必须在断开连接之前）
      console.log('📹 准备关闭设备，localParticipant:', localParticipant ? '存在' : '不存在');
      if (localParticipant) {
        try {
          console.log('🎤 开始关闭麦克风...');
          await localParticipant.setMicrophoneEnabled(false);
          console.log('✅ 麦克风已关闭');

          console.log('📷 开始关闭摄像头...');
          await localParticipant.setCameraEnabled(false);
          console.log('✅ 摄像头已关闭');
        } catch (error) {
          console.error('❌ 关闭设备时出错:', error);
        }
      } else {
        console.warn('⚠️ localParticipant 不存在，无法关闭设备');
      }

      // 获取存储的 intervieweeId 和 responseId
      if (!intervieweeId || !responseId) {
        console.warn('⚠️ 未找到 intervieweeId 或 responseId，跳过结束接口调用');
        router.push('/thank-you');
        return;
      }

      // 格式化消息数据为 OpenAI 标准格式
      const formattedMessages = messages.map((msg) => {
        // 根据 isLocal 判断角色：本地用户为 "user"，远程（agent）为 "assistant"
        const role = msg.from?.isLocal ? 'user' : 'assistant';

        return {
          role,
          content: msg.message,
          // 保留原始数据作为元数据（可选）
          metadata: {
            id: msg.id,
            timestamp: msg.timestamp,
            identity: msg.from?.identity,
            name: msg.from?.name,
            editTimestamp: msg.editTimestamp,
          },
        };
      });

      // 调用结束访谈接口
      const response = await fetch('/api/interview/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intervieweeId,
          responseId,
          messages: formattedMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('结束访谈接口调用失败:', data.error);
        // 即使接口失败也跳转到结束页面
      } else {
        console.log('✅ 访谈记录已保存');
      }

      // 清除存储的 ID
      clearInterviewIds();
    } catch (error) {
      console.error('结束访谈时发生错误:', error);
      // 即使出错也跳转到结束页面
    } finally {
      router.push('/thank-you'); // 跳转到结束页面
    }
  };

  return (
    <section className="bg-background relative z-10 h-full w-full overflow-hidden" {...props}>
      {/* Chat Transcript：如果 Agent 未入会，则不渲染聊天页面 */}
      {isAgentJoined && (
        <div
          className={cn(
            'fixed inset-0 grid grid-cols-1 grid-rows-1',
            !chatOpen && 'pointer-events-none'
          )}
        >
          <Fade top className="absolute inset-x-4 top-0 h-40" />
          <ScrollArea ref={scrollAreaRef} className="px-4 pt-40 pb-[150px] md:px-6 md:pb-[180px]">
            <ChatTranscript
              messages={messages}
              className="mx-auto max-w-2xl space-y-3 transition-opacity duration-300 ease-out"
            />
          </ScrollArea>
        </div>
      )}

      {/* Tile Layout */}
      <TileLayout chatOpen={chatOpen} />

      {/* Bottom */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}

        {/* Agent Status Indicator */}
        {isAgentSpeaking && (
          <div className="mb-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800 dark:border-orange-800/50 dark:bg-orange-900/30 dark:text-orange-200">
              <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
              Agent 正在说话，请稍等...
            </div>
          </div>
        )}

        <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <AgentControlBar
            controls={controls}
            onChatOpenChange={setChatOpen}
            onDisconnect={handleDisconnect}
          />
        </div>
      </MotionBottom>
    </section>
  );
};
