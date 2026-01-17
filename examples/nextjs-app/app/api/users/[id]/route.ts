import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/[id]
 * Route Handler - 获取单个用户
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[Route Handler] GET /api/users/${params.id}`);
  
  try {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${params.id}`,
      {
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const user = await response.json();
    
    return NextResponse.json({
      success: true,
      data: user,
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
 * PUT /api/users/[id]
 * Route Handler - 更新用户
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[Route Handler] PUT /api/users/${params.id}`);
  
  try {
    const body = await request.json();
    
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${params.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Route Handler] 更新用户失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Route Handler - 删除用户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[Route Handler] DELETE /api/users/${params.id}`);
  
  try {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${params.id}`,
      {
        method: 'DELETE',
      }
    );
    
    return NextResponse.json({
      success: true,
      message: '用户已删除',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Route Handler] 删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
