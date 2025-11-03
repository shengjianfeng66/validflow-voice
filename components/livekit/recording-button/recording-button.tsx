'use client';

import React from 'react';
import { Button } from '@/components/livekit/button';
import { cn } from '@/lib/utils';

interface RecordingButtonProps {
  isRecording: boolean;
  canStartRecording: boolean;
  isAgentSpeaking: boolean;
  onToggleRecording: () => void;
  className?: string;
}

export function RecordingButton({
  isRecording,
  canStartRecording,
  isAgentSpeaking,
  onToggleRecording,
  className,
}: RecordingButtonProps) {
  const getButtonText = () => {
    if (isRecording) {
      return '结束录音';
    }
    return '开始说话';
  };

  const getButtonVariant = () => {
    if (isRecording) {
      return 'destructive' as const;
    }
    return 'default' as const;
  };

  const isDisabled = isAgentSpeaking || (!canStartRecording && !isRecording);

  const handleClick = () => {
    onToggleRecording();
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        'min-w-[100px] transition-all duration-200',
        isRecording && 'animate-pulse',
        isDisabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isRecording ? (
          <>
            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {getButtonText()}
          </>
        ) : (
          <>
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                canStartRecording ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
            {getButtonText()}
          </>
        )}
      </div>
    </Button>
  );
}
