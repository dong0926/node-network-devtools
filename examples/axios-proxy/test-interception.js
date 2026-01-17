/**
 * 测试拦截器是否能捕获 axios 代理请求
 */

import { install } from '../../dist/esm/index.js';
import axios from 'axios';

console.log('🚀 启动拦截器测试...\n');

// 安装拦截器
await install();

console.log('✅ 拦截器已安装\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 测试 1: 不使用代理的普通请求
console.log('📝 测试 1: 普通 axios 请求（无代理）');
try {
  const response = await axios.get('https://httpbin.org/get', {
    timeout: 5000,
  });
  console.log('  ✅ 请求成功，状态码:', response.status);
} catch (error) {
  console.log('  ❌ 请求失败:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 测试 2: 使用代理的请求（通过配置）
console.log('📝 测试 2: axios 请求（配置代理）');
try {
  const response = await axios.get('https://httpbin.org/get', {
    proxy: {
      protocol: 'http',
      host: '127.0.0.1',
      port: 7897,
    },
    timeout: 5000,
  });
  console.log('  ✅ 请求成功，状态码:', response.status);
} catch (error) {
  console.log('  ❌ 请求失败:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 测试 3: 使用环境变量代理的请求
console.log('📝 测试 3: axios 请求（环境变量代理）');
console.log('  HTTP_PROXY:', process.env.HTTP_PROXY);
console.log('  HTTPS_PROXY:', process.env.HTTPS_PROXY);
try {
  const response = await axios.get('https://httpbin.org/get', {
    timeout: 5000,
  });
  console.log('  ✅ 请求成功，状态码:', response.status);
} catch (error) {
  console.log('  ❌ 请求失败:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🏁 测试完成');
