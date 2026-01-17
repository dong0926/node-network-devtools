// instrumentation.ts
// Next.js Instrumentation Hook
// 在服务端启动时自动初始化 node-network-devtools

export async function register() {
  // 仅在 Node.js 服务端运行时初始化
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // 动态导入以避免客户端打包问题
      const { install, setConfig, startGUI, getConfig } = await import('../../dist/esm/index.js');
      
      console.log('[node-network-devtools] 开始初始化...');
      console.log('[node-network-devtools] Node.js 版本:', process.version);
      console.log('[node-network-devtools] Next.js 运行时:', process.env.NEXT_RUNTIME);
      
      // 配置 node-network-devtools
      setConfig({
        maxRequests: 500,           // 最大存储请求数
        maxBodySize: 512 * 1024,    // 最大 body 大小（512KB）
        redactHeaders: ['authorization', 'cookie', 'x-api-key'], // 脱敏的头
        interceptHttp: true,        // 确保启用 HTTP 拦截
        interceptUndici: true,      // 确保启用 Undici/Fetch 拦截
      });
      
      await install();
      
      console.log('✓ [node-network-devtools] 已在 Next.js 服务端初始化');
      console.log('✓ [node-network-devtools] HTTP 拦截器已安装');
      console.log('✓ [node-network-devtools] Undici/Fetch 拦截器已安装');
      
      // 测试 fetch 是否被拦截
      console.log('[node-network-devtools] 测试 fetch 拦截...');
      try {
        await fetch('https://httpbin.org/get');
        console.log('✓ [node-network-devtools] 测试请求已发送');
      } catch (err) {
        console.log('⚠ [node-network-devtools] 测试请求失败:', err);
      }
      
      // 检查是否启用 GUI
      const config = getConfig();
      if (config.guiEnabled) {
        try {
          const guiInfo = await startGUI({
            autoOpen: config.autoOpen,
          });
          console.log('✓ [node-network-devtools] Web GUI 已启动');
          console.log(`  GUI URL: ${guiInfo.url}`);
          console.log(`  GUI Port: ${guiInfo.guiPort}`);
          console.log(`  WebSocket Port: ${guiInfo.wsPort}`);
        } catch (guiError) {
          console.warn('⚠ [node-network-devtools] GUI 启动失败:', guiError);
        }
      } else {
        console.log('💡 提示: 使用 NND_GUI_ENABLED=true 启用 Web GUI');
      }
    } catch (error) {
      console.warn('⚠ [node-network-devtools] 初始化失败:', error);
      console.warn('错误堆栈:', (error as Error).stack);
    }
  }
}
