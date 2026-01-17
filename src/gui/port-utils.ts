/**
 * 端口工具模块
 * 
 * 提供获取可用端口的功能
 */

import { createServer } from 'node:net';

/**
 * 检查端口是否可用
 */
export function isPortAvailable(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.listen(port, host);
  });
}

/**
 * 获取可用端口
 * 
 * @param preferredPort 首选端口，如果为 'auto' 则自动获取
 * @param host 监听地址
 * @param maxAttempts 最大尝试次数
 * @returns 可用端口号
 */
export async function getAvailablePort(
  preferredPort: number | 'auto' = 'auto',
  host: string = '127.0.0.1',
  maxAttempts: number = 10
): Promise<number> {
  // 如果是 'auto'，从随机端口开始
  if (preferredPort === 'auto') {
    return getRandomAvailablePort(host);
  }
  
  // 尝试首选端口
  if (await isPortAvailable(preferredPort, host)) {
    return preferredPort;
  }
  
  // 首选端口不可用，尝试后续端口
  for (let i = 1; i < maxAttempts; i++) {
    const port = preferredPort + i;
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  
  // 所有尝试都失败，获取随机可用端口
  return getRandomAvailablePort(host);
}

/**
 * 获取随机可用端口
 * 
 * 通过让系统分配端口来获取可用端口
 */
export function getRandomAvailablePort(host: string = '127.0.0.1'): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    
    server.once('error', (err) => {
      reject(err);
    });
    
    server.once('listening', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => {
          resolve(port);
        });
      } else {
        server.close(() => {
          reject(new Error('无法获取端口'));
        });
      }
    });
    
    // 端口 0 让系统自动分配可用端口
    server.listen(0, host);
  });
}
