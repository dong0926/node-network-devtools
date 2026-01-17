// instrumentation.ts
// 将此文件放在 Next.js 项目根目录（与 app 或 pages 目录同级）
// 
// 使用说明：
// 1. 复制此文件到你的 Next.js 项目根目录
// 2. 确保已安装 node-network-devtools: pnpm add node-network-devtools
// 3. 使用 --inspect 标志启动 Next.js: NODE_OPTIONS='--inspect' pnpm dev
// 4. 打开 Chrome DevTools (chrome://inspect) 查看网络请求

export async function register() {
  // 仅在 Node.js 服务端运行时初始化
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // 动态导入以避免客户端打包问题
      const { install, setConfig } = await import('node-network-devtools');
      
      // 可选：自定义配置
      // setConfig({
      //   maxRequests: 500,           // 最大存储请求数
      //   maxBodySize: 512 * 1024,    // 最大 body 大小（512KB）
      //   redactHeaders: ['authorization', 'cookie', 'x-api-key'], // 脱敏的头
      // });
      
      await install();
      
      console.log('[node-network-devtools] 已在 Next.js 服务端初始化');
      console.log('[node-network-devtools] 打开 chrome://inspect 查看网络请求');
    } catch (error) {
      console.warn('[node-network-devtools] 初始化失败:', error);
    }
  }
}
