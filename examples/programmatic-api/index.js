/**
 * 编程式 API 示例
 * 
 * 演示如何通过编程方式使用 node-network-devtools
 * 而不是通过 CLI 或 -r 标志
 * 
 * 运行方式：
 *   node index.js
 */

// 从源码导入（实际使用时从 'node-network-devtools' 导入）
import { 
  install,
  setConfig,
  getConfig,
  getRequestStore,
  startGUI,
} from '../../src/index.js';

async function main() {
  console.log('编程式 API 示例\n');
  
  // 自定义配置
  setConfig({
    maxRequests: 100,
    maxBodySize: 256 * 1024, // 256KB
    redactHeaders: ['authorization', 'cookie', 'x-api-key'],
    browserWindowSize: { width: 1200, height: 800 },
  });
  
  console.log('当前配置:', getConfig());
  console.log('');

  // 安装拦截器
  await install();
  console.log('✓ 拦截器已安装\n');

  // 启动 GUI（可选）
  const { url } = await startGUI();
  console.log(`✓ GUI 已启动: ${url}\n`);

  // 发起一些测试请求
  console.log('发起测试请求...');
  
  await fetch('https://jsonplaceholder.typicode.com/posts/1');
  console.log('  ✓ GET /posts/1');
  
  await fetch('https://jsonplaceholder.typicode.com/users/1');
  console.log('  ✓ GET /users/1');
  
  await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer secret-token',
      'X-API-Key': 'my-api-key',
    },
    body: JSON.stringify({ title: 'Test', body: 'Content' }),
  });
  console.log('  ✓ POST /posts');

  // 查询存储的请求
  console.log('\n=== 存储的请求 ===');
  const store = getRequestStore();
  const requests = store.getAll();
  
  requests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.method} ${req.url}`);
    console.log(`   状态: ${req.response?.statusCode || 'pending'}`);
    console.log(`   TraceID: ${req.traceId}`);
  });

  // 使用查询功能
  console.log('\n=== 查询示例 ===');
  
  const postRequests = store.query({ method: 'POST' });
  console.log(`POST 请求数量: ${postRequests.length}`);
  
  const userRequests = store.query({ urlPattern: /users/ });
  console.log(`包含 "users" 的请求: ${userRequests.length}`);

  console.log('\n完成！可以在浏览器窗口中查看所有请求');
}

main().catch(console.error);

