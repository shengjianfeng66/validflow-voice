import { NextResponse } from 'next/server';

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { intervieweeId, responseId, messages } = body;

    // 验证必填字段
    if (!intervieweeId || !responseId) {
      return NextResponse.json({ error: 'intervieweeId 和 responseId 为必填项' }, { status: 400 });
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages 必须是数组' }, { status: 400 });
    }

    // TODO: 在这里调用后端接口
    // 当后端接口准备好后，在这里添加实际的调用逻辑
    // 例如：
    // const response = await fetch('YOUR_BACKEND_URL/interview/end', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     intervieweeId,
    //     responseId,
    //     messages,
    //   }),
    // });
    // const backendData = await response.json();

    console.log('📝 结束访谈请求:', {
      intervieweeId,
      responseId,
      messageCount: messages.length,
    });

    // 目前先返回成功响应
    return NextResponse.json({ success: true, message: '访谈已结束' }, { status: 200 });
  } catch (error) {
    console.error('❌ 结束访谈接口错误:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
