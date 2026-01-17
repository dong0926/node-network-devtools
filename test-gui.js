// 简单测试 GUI 功能
import { install } from './dist/esm/index.js';

console.log('开始测试 GUI 功能...');

// 安装拦截器并启动 GUI
await install({
  guiEnabled: true,
  autoOpen: false, // 不自动打开浏览器，方便测试
});

console.log('GUI 功能已启动！');
console.log('请手动访问控制台输出的 URL 来查看 GUI 界面');

// 发起一些测试请求
console.log('\n发起测试请求...');
const response = await fetch('https://httpbin.org/get');
console.log('✓ 请求完成:', response.status);

// 保持进程运行 5 秒
await new Promise(resolve => setTimeout(resolve, 5000));
console.log('\n测试完成！');
process.exit(0);
