'use server';

/**
 * 使用 Node.js 原生 http/https 模块的 Server Actions
 * 这些请求可以被 node-network-devtools 捕获
 */

import https from 'node:https';
import { revalidateTag } from 'next/cache';

/**
 * 辅助函数：发起 HTTPS 请求
 */
function httpsRequest(
  hostname: string,
  path: string,
  method: string,
  data?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : undefined;
    
    const options: https.RequestOptions = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
      },
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (error) {
          reject(new Error(`解析响应失败: ${error}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Server Action - 创建用户（使用 https 模块）
 * 这个请求会被 node-network-devtools 捕获
 */
export async function createUserHttp(formData: FormData) {
  console.log('[Server Action HTTP] 创建用户...');
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  try {
    const response = await httpsRequest(
      'jsonplaceholder.typicode.com',
      '/users',
      'POST',
      { name, email }
    );
    
    console.log('[Server Action HTTP] 用户创建成功:', response.data);
    
    // 重新验证用户列表缓存
    revalidateTag('users');
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Server Action HTTP] 创建用户失败:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Server Action - 删除用户（使用 https 模块）
 * 这个请求会被 node-network-devtools 捕获
 */
export async function deleteUserHttp(formData: FormData) {
  console.log('[Server Action HTTP] 删除用户...');
  
  const userId = formData.get('userId') as string;
  
  try {
    const response = await httpsRequest(
      'jsonplaceholder.typicode.com',
      `/users/${userId}`,
      'DELETE'
    );
    
    console.log('[Server Action HTTP] 用户删除成功');
    
    // 重新验证用户列表缓存
    revalidateTag('users');
    
    return { success: true };
  } catch (error) {
    console.error('[Server Action HTTP] 删除用户失败:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Server Action - 获取用户列表（使用 https 模块）
 * 这个请求会被 node-network-devtools 捕获
 */
export async function getUsersHttp() {
  console.log('[Server Action HTTP] 获取用户列表...');
  
  try {
    const response = await httpsRequest(
      'jsonplaceholder.typicode.com',
      '/users',
      'GET'
    );
    
    console.log('[Server Action HTTP] 获取用户列表成功');
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Server Action HTTP] 获取用户列表失败:', error);
    return { success: false, error: String(error) };
  }
}
