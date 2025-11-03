'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Button } from '@/components/livekit/button';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({ startButtonText }: WelcomeViewProps) => {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');

  const handleStartCall = () => {
    if (roomId.trim() && userId.trim()) {
      // 导航到 /talk_room 页面，携带 roomId 和 userId 参数
      router.push(
        `/talk_room?roomId=${encodeURIComponent(roomId.trim())}&userId=${encodeURIComponent(userId.trim())}`
      );
    }
  };

  const isButtonDisabled = !roomId.trim() || !userId.trim();

  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center gap-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
    >
      <div className="flex w-full max-w-md flex-col gap-2 px-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="roomId" className="text-left text-sm font-medium">
            房间 ID
          </label>
          <input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="请输入房间 ID"
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="userId" className="text-left text-sm font-medium">
            用户 ID
          </label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="请输入用户 ID"
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      <Button onClick={handleStartCall} disabled={isButtonDisabled} className="mt-4">
        {startButtonText}
      </Button>
    </motion.div>
  );
};
