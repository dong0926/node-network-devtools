'use server';

import { revalidateTag } from 'next/cache';

/**
 * Server Action - 创建用户
 * 演示在 Server Action 中发起 POST 请求
 */
export async function createUser(formData: FormData) {
  console.log('[Server Action] 创建用户...');
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
      }),
    });
    
    const data = await response.json();
    console.log('[Server Action] 用户创建成功:', data);
    
    // 重新验证用户列表缓存
    revalidateTag('users');
    
    return { success: true, data };
  } catch (error) {
    console.error('[Server Action] 创建用户失败:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Server Action - 删除用户
 * 演示在 Server Action 中发起 DELETE 请求
 */
export async function deleteUser(formData: FormData) {
  console.log('[Server Action] 删除用户...');
  
  const userId = formData.get('userId') as string;
  
  try {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`,
      {
        method: 'DELETE',
      }
    );
    
    console.log('[Server Action] 用户删除成功');
    
    // 重新验证用户列表缓存
    revalidateTag('users');
    
    return { success: true };
  } catch (error) {
    console.error('[Server Action] 删除用户失败:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Server Action - 更新用户
 * 演示在 Server Action 中发起 PUT 请求
 */
export async function updateUser(userId: string, data: { name?: string; email?: string }) {
  console.log('[Server Action] 更新用户...');
  
  try {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    
    const result = await response.json();
    console.log('[Server Action] 用户更新成功:', result);
    
    // 重新验证用户列表缓存
    revalidateTag('users');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('[Server Action] 更新用户失败:', error);
    return { success: false, error: String(error) };
  }
}
