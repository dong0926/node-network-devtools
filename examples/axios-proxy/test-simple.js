/**
 * 最简单的测试：先不安装拦截器
 */

import axios from 'axios';

console.log('🧪 测试 axios 基本功能（无拦截器）\n');

// 测试 1: 普通请求
console.log('📝 测试 1: 普通请求');
try {
  const response = await axios.get('https://httpbin.org/get', {
    timeout: 5000,
  });
  console.log('  ✅ 成功，状态码:', response.status);
} catch (error) {
  console.log('  ❌ 失败:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 测试 2: 使用代理（环境变量）
console.log('📝 测试 2: 使用代理（环境变量）');
console.log('  HTTP_PROXY:', process.env.HTTP_PROXY);
console.log('  HTTPS_PROXY:', process.env.HTTPS_PROXY);
try {
  const response = await axios.get('https://httpbin.org/get', {
    timeout: 5000,
  });
  console.log('  ✅ 成功，状态码:', response.status);
} catch (error) {
  console.log('  ❌ 失败:', error.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 现在安装拦截器
console.log('🔧 安装拦截器...\n');
const { install } = await import('../../dist/esm/index.js');
await install();

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 测试 3: 安装拦截器后的普通请求
console.log('📝 测试 3: 安装拦截器后的普通请求');
try {
  const response = await axios.get('https://httpbin.org/get', {
    timeout: 5000,
  });
  console.log('  ✅ 成功，状态码:', response.status);
} catch (error) {
  console.log('  ❌ 失败:', error.message);
  console.log('  错误详情:', error);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 测试 4: 安装拦截器后使用代理
console.log('📝 测试 4: 安装拦截器后使用代理');
try {
  const response = await axios.get('https://httpbin.org/get', {
    timeout: 5000,
  });
  console.log('  ✅ 成功，状态码:', response.status);
} catch (error) {
  console.log('  ❌ 失败:', error.message);
  console.log('  错误详情:', error);
}

console.log('\n🏁 测试完成');
