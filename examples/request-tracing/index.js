/**
 * 请求追踪示例
 * 
 * 演示如何使用 TraceID 关联同一业务流程中的多个请求
 * 
 * 运行方式：
 *   npx node-network-devtools index.js
 */

// 注意：在实际使用中，这些会从 node-network-devtools 包导入
// 这里为了演示，直接从源码导入
import { 
  runWithTrace, 
  getCurrentTraceId,
  getRequestStore 
} from '../../src/index.js';

console.log('请求追踪示例');
console.log('打开 chrome://inspect 查看网络请求\n');

async function main() {
  // 场景 1: 用户登录流程
  console.log('=== 场景 1: 用户登录流程 ===');
  await runWithTrace('user-login', async () => {
    const traceId = getCurrentTraceId();
    console.log(`TraceID: ${traceId}`);
    
    // 步骤 1: 验证用户
    await fetch('https://jsonplaceholder.typicode.com/users/1');
    console.log('  ✓ 验证用户');
    
    // 步骤 2: 获取用户权限
    await fetch('https://jsonplaceholder.typicode.com/posts?userId=1');
    console.log('  ✓ 获取用户权限');
    
    // 步骤 3: 记录登录日志
    await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', userId: 1 }),
    });
    console.log('  ✓ 记录登录日志');
  });

  // 场景 2: 数据同步流程
  console.log('\n=== 场景 2: 数据同步流程 ===');
  await runWithTrace('data-sync', async () => {
    const traceId = getCurrentTraceId();
    console.log(`TraceID: ${traceId}`);
    
    // 并发获取多个资源
    await Promise.all([
      fetch('https://jsonplaceholder.typicode.com/posts'),
      fetch('https://jsonplaceholder.typicode.com/comments'),
      fetch('https://jsonplaceholder.typicode.com/albums'),
    ]);
    console.log('  ✓ 同步完成（3 个并发请求）');
  });


  // 查询存储的请求
  console.log('\n=== 查询存储的请求 ===');
  const store = getRequestStore();
  
  const loginRequests = store.getByTraceId('user-login');
  console.log(`用户登录流程: ${loginRequests.length} 个请求`);
  
  const syncRequests = store.getByTraceId('data-sync');
  console.log(`数据同步流程: ${syncRequests.length} 个请求`);
  
  console.log('\n所有请求完成！查看 Chrome DevTools Network 面板');
  console.log('提示：在 DevTools 中可以看到相同 TraceID 的请求被关联在一起');
}

main().catch(console.error);
