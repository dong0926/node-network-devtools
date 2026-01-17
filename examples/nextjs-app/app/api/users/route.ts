import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users
 * Route Handler - 获取用户列表
 */
export async function GET(request: NextRequest) {
  console.log('[Route Handler] GET /api/users');
  
  try {
    // 从外部 API 获取数据
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      // Route Handler 中的请求默认不缓存
      cache: 'no-store',
    });
    
    const users = await response.json();
    
    return NextResponse.json({
      success: true,
      data: users,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Route Handler] 获取用户失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Route Handler - 创建用户
 */
export async function POST(request: NextRequest) {
  console.log('[Route Handler] POST /api/users');
  
  try {
    const body = await request.json();
    
    // 发送到外部 API
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[Route Handler] 创建用户失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
