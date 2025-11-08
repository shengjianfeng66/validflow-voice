'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/livekit/button';

export default function ThankYouPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 text-center shadow-2xl dark:bg-gray-800">
                <div className="space-y-4">
                    {/* 图标 */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <svg
                            className="h-10 w-10 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    {/* 标题 */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">感谢您的访谈</h1>

                    {/* 描述 */}
                    <p className="text-gray-600 dark:text-gray-300">
                        您的反馈对我们非常重要。感谢您抽出宝贵时间参与本次访谈。
                    </p>
                </div>
            </div>
        </div>
    );
}
