'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/livekit/button';
import { motion } from 'motion/react';



interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({ startButtonText, onStartCall }: WelcomeViewProps) => {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');

  const handleStartCall = () => {
    if (roomId.trim() && userId.trim()) {
      // 导航到 /talk_room 页面，携带 roomId 和 userId 参数
      router.push(`/talk_room?roomId=${encodeURIComponent(roomId.trim())}&userId=${encodeURIComponent(userId.trim())}`);
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
      <div className="flex flex-col gap-2 max-w-md w-full px-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="roomId" className="text-sm font-medium text-left">
            房间 ID
          </label>
          <input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="请输入房间ID"
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label htmlFor="userId" className="text-sm font-medium text-left">
            用户 ID
          </label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="请输入用户ID"
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>
      
      <Button 
        onClick={handleStartCall}
        disabled={isButtonDisabled}
        className="mt-4"
      >
        {startButtonText}
      </Button>
    </motion.div>
  );
};
