/**
 * 自动注册入口
 * 
 * 使用方式：node -r node-network-devtools/register your-script.js
 * 或：node --import node-network-devtools/register your-script.js
 * 
 * 注意：Network 面板功能需要：
 * - Node.js 20.18.0+ 版本
 * - --experimental-network-inspection 标志
 * - Chrome DevTools 目前还不支持显示 Network 事件（功能待实现）
 */

import { getConfig } from './config.js';
import { HttpPatcher } from './interceptors/http-patcher.js';
import { UndiciPatcher } from './interceptors/undici-patcher.js';
import { getCDPBridge, isInspectorEnabled, getInspectorUrl } from './cdp/cdp-bridge.js';
import { getRequestStore } from './store/ring-buffer.js';
import { getGUIServer } from './gui/server.js';
import { getEventBridge } from './gui/event-bridge.js';
import { openBrowser } from './gui/browser-launcher.js';
import * as inspector from 'node:inspector';

// 检查 Network API 是否可用
const hasNetworkAPI = typeof (inspector as any).Network?.requestWillBeSent === 'function';

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
 * 初始化所有拦截器和 CDP 桥接
 */
async function initialize(): Promise<void> {
  const config = getConfig();

  // 检查 Inspector 是否启用
  if (!isInspectorEnabled()) {
    warn('Inspector 未启用！请使用 --inspect 或 --inspect-brk 标志启动 Node.js');
    warn('示例：node --inspect -r node-network-devtools/register your-script.js');
    warn('或使用 CLI：npx node-network-devtools your-script.js');
    return;
  }

  const inspectorUrl = getInspectorUrl();
  info(`Inspector 已启用: ${inspectorUrl}`);

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

  // 连接 CDP Bridge
  if (config.autoConnect) {
    try {
      const bridge = getCDPBridge();
      await bridge.connect();
      info('CDP Bridge 已连接');
    } catch (error) {
      warn(`CDP Bridge 连接失败: ${error}`);
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
          await openBrowser(url, { usePuppeteer: config.usePuppeteer });
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

  info('初始化完成，网络请求将被捕获并发送到 DevTools');
  
  // 检查 Network API 可用性
  if (!hasNetworkAPI) {
    warn('inspector.Network API 不可用');
    warn('Network 面板功能需要：');
    warn('  1. Node.js 20.18.0+ 版本');
    warn('  2. --experimental-network-inspection 标志');
    warn('示例：node --inspect --experimental-network-inspection your-script.js');
    warn('');
    warn('注意：Chrome DevTools Network 面板目前还不支持显示这些事件');
    warn('请求数据仍会被捕获并可通过编程 API 访问');
  } else {
    info('inspector.Network API 可用，事件将广播到 DevTools');
    warn('注意：Chrome DevTools Network 面板可能还不支持显示这些事件');
  }
}

// 自动初始化
initialize().catch((error) => {
  warn(`初始化失败: ${error}`);
});

// 导出供编程使用
export { getConfig, getRequestStore, getCDPBridge, getGUIServer, getEventBridge };
