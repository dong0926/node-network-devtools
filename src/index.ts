/**
 * Node Network DevTools
 * 
 * Node.js 网络请求监听工具，通过 Web GUI 实时监控请求
 */

// 配置模块
export { 
  getConfig, 
  setConfig, 
  resetConfig,
  type Config 
} from './config.js';

// 请求存储
export { 
  getRequestStore, 
  resetRequestStore,
  createRequestStore,
  type IRequestStore,
  type RequestData,
  type ResponseData,
  type ErrorData,
  type TimingData,
  type QueryFilter,
} from './store/ring-buffer.js';

// 上下文管理
export {
  generateTraceId,
  getCurrentTraceId,
  getCurrentContext,
  startTrace,
  runWithContext,
  runWithTrace,
  runWithTraceAsync,
  updateContextMetadata,
  getTraceDuration,
  createTraceIdGetter,
  ContextManager,
  type TraceContext,
} from './context/context-manager.js';

// HTTP 拦截器
export { HttpPatcher } from './interceptors/http-patcher.js';

// Undici/Fetch 拦截器
export { UndiciPatcher } from './interceptors/undici-patcher.js';

// Next.js 适配器
export {
  NextJsAdapter,
  isNextJsEnvironment,
  getCurrentRoute,
  runWithRoute,
  runWithRouteAsync,
  extractNextJsOptions,
  extractNextJsMetadata,
  createInstrumentationConfig,
  type NextJsMetadata,
  type NextJsFetchOptions,
} from './adapters/nextjs.js';

// GUI 服务器
export {
  getGUIServer,
  resetGUIServer,
  createGUIServer,
  type IGUIServer,
  type GUIServerConfig,
} from './gui/server.js';

// WebSocket Hub
export {
  getWebSocketHub,
  resetWebSocketHub,
  createWebSocketHub,
  createRequestStartMessage,
  createRequestCompleteMessage,
  createRequestErrorMessage,
  createInitialDataMessage,
  createClearMessage,
  type IWebSocketHub,
  type WSMessage,
  type WSMessageType,
} from './gui/websocket-hub.js';

// Event Bridge
export {
  getEventBridge,
  resetEventBridge,
  createEventBridge,
  type IEventBridge,
} from './gui/event-bridge.js';

// 浏览器启动器
export {
  openBrowser,
  closeBrowser,
} from './gui/browser-launcher.js';

// 端口工具
export {
  getAvailablePort,
  isPortAvailable,
} from './gui/port-utils.js';

/**
 * 快速初始化函数
 * 
 * 一键安装所有拦截器
 */
export async function install(): Promise<void> {
  const { getConfig } = await import('./config.js');
  const { HttpPatcher } = await import('./interceptors/http-patcher.js');
  const { UndiciPatcher } = await import('./interceptors/undici-patcher.js');

  const config = getConfig();

  if (config.interceptHttp) {
    HttpPatcher.install();
  }

  if (config.interceptUndici) {
    UndiciPatcher.install();
  }
}

/**
 * 启动 GUI 服务器
 * 
 * @param options - GUI 服务器配置
 * @returns GUI 服务器信息
 */
export async function startGUI(options?: {
  guiPort?: number | 'auto';
  wsPort?: number | 'auto';
  host?: string;
  autoOpen?: boolean;
}): Promise<{ url: string; guiPort: number; wsPort: number }> {
  const { getConfig } = await import('./config.js');
  const { getGUIServer } = await import('./gui/server.js');
  const { getEventBridge } = await import('./gui/event-bridge.js');
  const { openBrowser } = await import('./gui/browser-launcher.js');

  const config = getConfig();
  const guiServer = getGUIServer();
  const result = await guiServer.start({
    guiPort: options?.guiPort ?? 'auto',
    wsPort: options?.wsPort ?? 'auto',
    host: options?.host ?? '127.0.0.1',
  });

  // 启动 Event Bridge
  const eventBridge = getEventBridge();
  eventBridge.start();

  // 自动打开浏览器（优先使用 options，否则使用配置）
  const shouldAutoOpen = options?.autoOpen !== undefined ? options.autoOpen : config.autoOpen;
  if (shouldAutoOpen) {
    await openBrowser(result.url);
  }

  return result;
}

/**
 * 停止 GUI 服务器
 */
export async function stopGUI(): Promise<void> {
  const { getGUIServer } = await import('./gui/server.js');
  const { getEventBridge } = await import('./gui/event-bridge.js');
  const { closeBrowser } = await import('./gui/browser-launcher.js');

  const eventBridge = getEventBridge();
  eventBridge.stop();

  const guiServer = getGUIServer();
  await guiServer.stop();

  await closeBrowser();
}
