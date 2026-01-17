/**
 * 调试脚本：检查 axios 使用的底层模块
 */

import axios from 'axios';
import http from 'node:http';
import https from 'node:https';

console.log('🔍 检查 axios 配置和底层实现');
console.log('');

// 检查 axios 默认配置
console.log('📋 axios 默认配置:');
console.log('  baseURL:', axios.defaults.baseURL);
console.log('  proxy:', axios.defaults.proxy);
console.log('  httpAgent:', axios.defaults.httpAgent);
console.log('  httpsAgent:', axios.defaults.httpsAgent);
console.log('');

// 检查环境变量
console.log('🌍 环境变量:');
console.log('  HTTP_PROXY:', process.env.HTTP_PROXY);
console.log('  HTTPS_PROXY:', process.env.HTTPS_PROXY);
console.log('  NO_PROXY:', process.env.NO_PROXY);
console.log('');

// 检查 http/https 模块
console.log('📦 Node.js 模块:');
console.log('  http.request:', typeof http.request);
console.log('  https.request:', typeof https.request);
console.log('');

// 尝试创建一个 axios 实例并检查其配置
const instance = axios.create();
console.log('🔧 axios 实例:');
console.log('  adapter:', instance.defaults.adapter);
console.log('');

// 检查 axios 是否会自动使用代理
console.log('🧪 测试 axios 代理检测:');
try {
  const config = axios.getUri({
    url: 'https://example.com/path',
    method: 'GET',
  });
  console.log('  生成的 URI:', config);
} catch (error) {
  console.error('  错误:', error.message);
}
