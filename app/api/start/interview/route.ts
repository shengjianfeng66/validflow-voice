import { NextResponse } from 'next/server';

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email } = body;

    // 验证必填字段
    if (!name || !email) {
      return NextResponse.json({ error: '姓名和邮箱为必填项' }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    // TODO: 在这里调用后端接口
    // 当后端接口准备好后，在这里添加实际的调用逻辑
    // 例如：
    // const response = await fetch('YOUR_BACKEND_URL/start/interview', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name, email }),
    // });
    // const backendData = await response.json();

    console.log('📝 开始访谈请求:', { name, email });

    // 目前先返回成功响应
    return NextResponse.json(
      {
        success: true,
        data: {
          name,
          email,
          intervieweeId: '1234567890',
          reesponsibleId: '32328372893729873982',
        },
        message: '访谈已开始',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ 开始访谈接口错误:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
