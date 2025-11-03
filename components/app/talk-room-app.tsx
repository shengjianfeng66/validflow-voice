'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { SessionProvider, useSession } from '@/components/app/session-provider';
import { SessionView } from '@/components/app/session-view';
import { Button } from '@/components/livekit/button';
import { Toaster } from '@/components/livekit/toaster';

interface TalkRoomAppProps {
  appConfig: AppConfig;
}

interface TalkRoomContentProps {
  appConfig: AppConfig;
  roomId: string;
  userId: string;
}

function TalkRoomContent({ appConfig, roomId, userId }: TalkRoomContentProps) {
  const router = useRouter();
  const { startSession, isSessionActive } = useSession();

  const handleBackToHome = () => {
    router.push('/');
  };

  // 自动开始会话
  useEffect(() => {
    if (!isSessionActive) {
      startSession();
    }
  }, [startSession, isSessionActive]);

  return (
    <div className="relative h-svh">
      {/* Header with room info and back button */}
      <div className="bg-background/80 border-border/50 absolute top-0 right-0 left-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBackToHome}>
            ← 返回首页
          </Button>
          <div className="text-muted-foreground text-sm">
            <span className="font-medium">房间：</span>
            <span className="font-mono">{roomId}</span>
            <span className="mx-2">|</span>
            <span className="font-medium">用户：</span>
            <span className="font-mono">{userId}</span>
          </div>
        </div>
      </div>

      {/* Main content with top padding for header */}
      <main className="grid h-svh grid-cols-1 place-content-center pt-16">
        <SessionView appConfig={appConfig} />
      </main>
    </div>
  );
}

function TalkRoomSearchParams({ appConfig }: TalkRoomAppProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const roomIdParam = searchParams.get('roomId');
    const userIdParam = searchParams.get('userId');

    if (!roomIdParam || !userIdParam) {
      // 如果没有必要的参数，重定向到首页
      router.push('/');
      return;
    }

    setRoomId(roomIdParam);
    setUserId(userIdParam);
  }, [searchParams, router]);

  if (!roomId || !userId) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider appConfig={appConfig}>
      <TalkRoomContent appConfig={appConfig} roomId={roomId} userId={userId} />
      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </SessionProvider>
  );
}

export function TalkRoomApp({ appConfig }: TalkRoomAppProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-svh items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      }
    >
      <TalkRoomSearchParams appConfig={appConfig} />
    </Suspense>
  );
}
