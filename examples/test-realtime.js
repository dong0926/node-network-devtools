/**
 * 测试实时更新功能
 * 
 * 这个脚本会定期发送 HTTP 请求，用于测试 GUI 的实时更新
 */

import https from 'node:https';

let requestCount = 0;

function makeRequest() {
  requestCount++;
  const url = `https://httpbin.org/get?count=${requestCount}`;
  
  console.log(`[${new Date().toISOString()}] 发送请求 #${requestCount}: ${url}`);
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] 请求 #${requestCount} 完成: ${res.statusCode}`);
    });
  }).on('error', (err) => {
    console.error(`[${new Date().toISOString()}] 请求 #${requestCount} 失败:`, err.message);
  });
}

console.log('开始测试实时更新...');
console.log('请打开 GUI 页面观察请求是否实时出现');
console.log('');

// 立即发送第一个请求
makeRequest();

// 每 3 秒发送一个请求
const interval = setInterval(() => {
  makeRequest();
  
  // 发送 10 个请求后停止
  if (requestCount >= 10) {
    clearInterval(interval);
    console.log('');
    console.log('测试完成！共发送 10 个请求');
    console.log('如果 GUI 中实时显示了这些请求，说明实时更新功能正常');
    
    // 等待最后一个请求完成后退出
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  }
}, 3000);
