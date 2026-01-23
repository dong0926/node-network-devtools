/**
 * 自动注册入口
 * 
 * 使用方式：node -r node-network-devtools/register your-script.js
 * 或：node --import node-network-devtools/register your-script.js
 * 
 * 注意：此工具仅用于开发环境，不推荐在生产环境中使用。
 */

import { getConfig } from './config.js';
import { HttpPatcher } from './interceptors/http-patcher.js';
import { UndiciPatcher } from './interceptors/undici-patcher.js';
import { ServerPatcher } from './interceptors/server-patcher.js';
import { getRequestStore } from './store/ring-buffer.js';
import { getGUIServer } from './gui/server.js';
import { getEventBridge } from './gui/event-bridge.js';
import { openBrowser } from './gui/browser-launcher.js';

/**
 * 输出警告信息
 */
function warn(message: string): void {
  console.warn(`\x1b[33m[node-network-devtools]\x1b[0m ${message}`);
}

/**
 * 输出信息
 */
function info(message: string): void {
  console.log(`\x1b[36m[node-network-devtools]\x1b[0m ${message}`);
}

/**
 * 初始化所有拦截器和 GUI 服务器
 */
async function initialize(): Promise<void> {
  const config = getConfig();

  // 安装 HTTP 拦截器
  if (config.interceptHttp) {
    try {
      HttpPatcher.install();
      info('HTTP/HTTPS 拦截器已安装');
    } catch (error) {
      warn(`HTTP 拦截器安装失败: ${error}`);
    }
  }

  // 安装 Undici/Fetch 拦截器
  if (config.interceptUndici) {
    try {
      UndiciPatcher.install();
      info('Undici/Fetch 拦截器已安装');
    } catch (error) {
      warn(`Undici 拦截器安装失败: ${error}`);
    }
  }

  // 安装 Server Trace 拦截器
  if (config.traceEnabled) {
    try {
      ServerPatcher.install();
      info('Server Trace 拦截器已安装');
    } catch (error) {
      warn(`Server Trace 拦截器安装失败: ${error}`);
    }
  }

  // 启动 GUI 服务器（如果启用）
  if (config.guiEnabled) {
    try {
      const guiServer = getGUIServer();
      const { url, wsPort } = await guiServer.start({
        guiPort: config.guiPort,
        wsPort: config.wsPort,
        host: config.guiHost,
      });
      
      // 启动 Event Bridge
      const eventBridge = getEventBridge();
      eventBridge.start();
      
      info(`GUI 服务器已启动: ${url}`);
      
      // 自动打开浏览器
      if (config.autoOpen) {
        try {
          await openBrowser(url);
          info('浏览器已打开');
        } catch (error) {
          warn(`打开浏览器失败: ${error}`);
          info(`请手动打开: ${url}`);
        }
      }
    } catch (error) {
      warn(`GUI 服务器启动失败: ${error}`);
    }
  }

  info('初始化完成，网络请求将被捕获并显示在 GUI 中');
}

// 自动初始化
initialize().catch((error) => {
  warn(`初始化失败: ${error}`);
});

// 导出供编程使用
export { getConfig, getRequestStore, getGUIServer, getEventBridge };
