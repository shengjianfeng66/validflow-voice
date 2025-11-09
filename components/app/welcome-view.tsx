'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRightIcon,
  CameraIcon,
  CheckCircleIcon,
  MicrophoneIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/livekit/button';
import { useInterviewStore } from '@/store/interview-store';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

type Step = 'device-setup' | 'user-info';

export const WelcomeView = ({ startButtonText }: WelcomeViewProps) => {
  const router = useRouter();
  const { setInterviewIds } = useInterviewStore();
  const [step, setStep] = useState<Step>('device-setup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // 设备权限状态
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>(
    'pending'
  );
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);

  // 请求麦克风权限
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      // 获取麦克风设备列表
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter((device) => device.kind === 'audioinput');
      setMicDevices(audioDevices);
      if (audioDevices.length > 0 && !selectedMicId) {
        setSelectedMicId(audioDevices[0].deviceId);
      }
      // 关闭测试流
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error('麦克风权限被拒绝:', error);
      setMicPermission('denied');
    }
  };

  // 取消麦克风权限
  const revokeMicPermission = () => {
    setMicPermission('pending');
    setMicDevices([]);
    setSelectedMicId('');
  };

  // 请求摄像头权限
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      // 关闭测试流
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error('摄像头权限被拒绝:', error);
      setCameraPermission('denied');
    }
  };

  // 取消摄像头权限
  const revokeCameraPermission = () => {
    setCameraPermission('pending');
  };

  // 邮箱格式验证
  function validateEmail(email: string): string {
    if (!email.trim()) {
      return '请输入邮箱地址';
    }

    // 常用邮箱格式正则表达式
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return '请输入有效的邮箱地址';
    }

    // 检查常见错误
    if (email.includes('..')) {
      return '邮箱地址不能包含连续的点号';
    }

    if (email.startsWith('.') || email.startsWith('@')) {
      return '邮箱格式不正确';
    }

    const [localPart, domain] = email.split('@');

    if (!localPart || localPart.length < 1) {
      return '邮箱用户名不能为空';
    }

    if (!domain || !domain.includes('.')) {
      return '邮箱域名格式不正确';
    }

    // 检查域名部分
    const domainParts = domain.split('.');
    if (domainParts.some((part) => part.length < 1)) {
      return '邮箱域名格式不正确';
    }

    return '';
  }

  // 处理邮箱输入
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailTouched) {
      setEmailError(validateEmail(value));
    }
  };

  // 处理邮箱失焦
  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleStartCall = async () => {
    // 验证邮箱
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailTouched(true);
      setEmailError(emailValidationError);
      return;
    }

    if (!name.trim() || !email.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 调用开始访谈接口
      const response = await fetch('/api/start/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      // 保存 intervieweeId 和 responseId 到 store
      if (data.data?.intervieweeId && data.data?.responseId) {
        setInterviewIds(data.data.intervieweeId, data.data.responseId);
      }

      // 接口调用成功，导航到 /talk_room 页面
      router.push(
        `/talk_room?name=${encodeURIComponent(name.trim())}&email=${encodeURIComponent(email.trim())}`
      );
    } catch (error) {
      console.error('开始访谈失败:', error);
      setSubmitError(error instanceof Error ? error.message : '开始访谈失败，请重试');
      setIsSubmitting(false);
    }
  };

  const canProceedToUserInfo = micPermission === 'granted';
  const isStartButtonDisabled = !name.trim() || !email.trim() || !!emailError || isSubmitting;

  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center gap-6 px-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
    >
      {/* 步骤指示器 */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`flex items-center gap-2 ${step === 'device-setup' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              step === 'device-setup'
                ? 'border-primary bg-primary text-primary-foreground'
                : micPermission === 'granted'
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-muted-foreground'
            }`}
          >
            {micPermission === 'granted' && step !== 'device-setup' ? (
              <CheckCircleIcon weight="fill" size={20} />
            ) : (
              '1'
            )}
          </div>
          <span className="text-sm">设备设置</span>
        </div>
        <div className="bg-border h-0.5 w-12" />
        <div
          className={`flex items-center gap-2 ${step === 'user-info' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              step === 'user-info'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground'
            }`}
          >
            2
          </div>
          <span className="text-sm">用户信息</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'device-setup' && (
          <motion.div
            key="device-setup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex w-full max-w-md flex-col gap-4"
          >
            <h2 className="text-2xl font-bold">设备设置</h2>
            <p className="text-muted-foreground text-sm">
              请授予麦克风和摄像头权限，并选择您要使用的设备
            </p>

            {/* 麦克风权限 */}
            <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MicrophoneIcon size={24} weight="fill" />
                  <span className="font-medium">麦克风</span>
                </div>
                {micPermission === 'granted' ? (
                  <Button size="sm" variant="outline" onClick={revokeMicPermission}>
                    取消授权
                  </Button>
                ) : micPermission === 'denied' ? (
                  <span className="text-sm text-red-600">权限被拒绝</span>
                ) : (
                  <Button size="sm" onClick={requestMicPermission}>
                    授权
                  </Button>
                )}
              </div>

              {micPermission === 'granted' && micDevices.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-left text-sm font-medium">选择麦克风</label>
                  <select
                    value={selectedMicId}
                    onChange={(e) => setSelectedMicId(e.target.value)}
                    className="focus:ring-primary border-border bg-background text-foreground rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  >
                    {micDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `麦克风 ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 摄像头权限 */}
            <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CameraIcon size={24} weight="fill" />
                  <span className="font-medium">摄像头（可选）</span>
                </div>
                {cameraPermission === 'granted' ? (
                  <Button size="sm" variant="outline" onClick={revokeCameraPermission}>
                    取消授权
                  </Button>
                ) : cameraPermission === 'denied' ? (
                  <span className="text-sm text-red-600">权限被拒绝</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={requestCameraPermission}>
                    授权
                  </Button>
                )}
              </div>
            </div>

            <Button
              onClick={() => setStep('user-info')}
              disabled={!canProceedToUserInfo}
              variant={canProceedToUserInfo ? 'primary' : 'default'}
              className="mt-4 gap-2"
            >
              下一步
              <ArrowRightIcon weight="bold" size={16} />
            </Button>
          </motion.div>
        )}

        {step === 'user-info' && (
          <motion.div
            key="user-info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex w-full max-w-md flex-col gap-4"
          >
            <h2 className="text-2xl font-bold">用户信息</h2>
            <p className="text-muted-foreground text-sm">请填写您的姓名和邮箱</p>

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-left text-sm font-medium">
                姓名
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-left text-sm font-medium">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="example@domain.com"
                className={`border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none ${
                  emailError && emailTouched
                    ? 'border-red-500 focus:ring-red-500'
                    : email && !emailError && emailTouched
                      ? 'border-green-500 focus:ring-green-500'
                      : ''
                }`}
              />
              {emailError && emailTouched && (
                <p className="text-left text-xs text-red-600">{emailError}</p>
              )}
              {email && !emailError && emailTouched && (
                <p className="text-left text-xs text-green-600">✓ 邮箱格式正确</p>
              )}
            </div>

            {submitError && (
              <div className="rounded-md border border-red-500 bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-left text-sm text-red-600 dark:text-red-400">{submitError}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setStep('device-setup')} className="flex-1">
                上一步
              </Button>
              <Button
                onClick={handleStartCall}
                disabled={isStartButtonDisabled}
                variant={!isStartButtonDisabled ? 'primary' : 'default'}
                className="flex-1"
              >
                {isSubmitting ? '提交中...' : startButtonText}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
