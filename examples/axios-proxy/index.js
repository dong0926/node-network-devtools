/**
 * axios + HTTP 代理测试示例
 * 
 * 测试场景：
 * 1. 使用 axios 发起请求
 * 2. 配置 HTTP_PROXY 环境变量
 * 3. 验证 node-network-devtools 是否能正确处理
 * 
 * 运行方式：
 * - 无代理：pnpm start
 * - 有代理：pnpm start:proxy
 */

import axios from 'axios';

// 导入 node-network-devtools（使用相对路径指向构建产物）
import { install, setConfig } from '../../dist/esm/index.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 axios + HTTP 代理测试');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// 显示环境信息
console.log('📋 环境信息:');
console.log('  Node.js 版本:', process.version);
console.log('  HTTP_PROXY:', process.env.HTTP_PROXY || '(未设置)');
console.log('  HTTPS_PROXY:', process.env.HTTPS_PROXY || '(未设置)');
console.log('');

// 配置 node-network-devtools
console.log('🔧 配置 node-network-devtools...');
setConfig({
  interceptHttp: true,
  interceptUndici: true,
  maxRequests: 100,
});

// 安装拦截器
console.log('📦 安装拦截器...');
await install();
console.log('✅ 拦截器安装完成');
console.log('');

// 测试 1：使用 axios 发起简单请求
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('测试 1: axios GET 请求');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  console.log('发起请求: https://httpbin.org/get');
  const response = await axios.get('https://httpbin.org/get');
  console.log('✅ 请求成功');
  console.log('  状态码:', response.status);
  console.log('  响应数据:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
} catch (error) {
  console.error('❌ 请求失败:', error.message);
  if (error.code) {
    console.error('  错误代码:', error.code);
  }
  if (error.config?.url) {
    console.error('  请求 URL:', error.config.url);
  }
}

console.log('');

// 测试 2：使用 axios 发起 POST 请求
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('测试 2: axios POST 请求');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  console.log('发起请求: https://httpbin.org/post');
  const response = await axios.post('https://httpbin.org/post', {
    test: 'data',
    timestamp: Date.now(),
  });
  console.log('✅ 请求成功');
  console.log('  状态码:', response.status);
  console.log('  响应数据:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
} catch (error) {
  console.error('❌ 请求失败:', error.message);
  if (error.code) {
    console.error('  错误代码:', error.code);
  }
}

console.log('');

// 测试 3：模拟用户的真实场景
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('测试 3: 模拟真实 API 请求');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  // 模拟用户报告的 URL
  const apiUrl = 'https://jsonplaceholder.typicode.com/posts/1';
  console.log('发起请求:', apiUrl);
  
  const response = await axios.get(apiUrl);
  console.log('✅ 请求成功');
  console.log('  状态码:', response.status);
  console.log('  响应数据:', JSON.stringify(response.data, null, 2));
} catch (error) {
  console.error('❌ 请求失败:', error.message);
  if (error.code) {
    console.error('  错误代码:', error.code);
  }
  
  // 检查是否是 URL 重复拼接问题
  if (error.message.includes('Invalid URL') || error.code === 'ERR_INVALID_URL') {
    console.error('');
    console.error('🔴 检测到 URL 重复拼接问题！');
    console.error('  这是 axios + 代理 + node-network-devtools 的兼容性问题');
    console.error('  请查看 AXIOS-PROXY-ISSUE.md 了解详情');
  }
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 测试完成');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
