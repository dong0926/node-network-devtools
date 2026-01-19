/**
 * TypeScript 集成测试
 * 
 * 本测试验证：
 * 1. TypeScript 类型定义正确导出
 * 2. 所有主要 API 的类型可用
 * 3. 类型推断正常工作
 * 4. 没有类型错误
 */

import {
  getConfig,
  setConfig,
  resetConfig,
  getRequestStore,
  createRequestStore,
  HttpPatcher,
  UndiciPatcher,
  getGUIServer,
  createGUIServer,
  getWebSocketHub,
  createWebSocketHub,
  getEventBridge,
  createEventBridge,
  ContextManager,
  generateTraceId,
  getCurrentTraceId,
  install,
  startGUI,
  stopGUI,
  type Config,
  type IRequestStore,
  type IGUIServer,
  type IWebSocketHub,
  type IEventBridge,
  type TraceContext,
} from '@mt0926/node-network-devtools';

// 测试配置 API 类型
function testConfigTypes(): void {
  const config: Config = getConfig();
  
  // 验证配置对象的类型
  const maxRequests: number = config.maxRequests;
  const maxBodySize: number = config.maxBodySize;
  const interceptHttp: boolean = config.interceptHttp;
  const interceptUndici: boolean = config.interceptUndici;
  
  // 验证 setConfig 函数类型
  setConfig({
    maxRequests: 2000,
    maxBodySize: 2 * 1024 * 1024,
  });
  
  // 验证 resetConfig 函数类型
  resetConfig();
  
  console.log('✓ 配置 API 类型验证通过');
}

// 测试请求存储 API 类型
function testRequestStoreTypes(): void {
  // 验证单例获取函数
  const store: IRequestStore = getRequestStore();
  
  // 验证创建函数
  const customStore: IRequestStore = createRequestStore(500);
  
  // 验证存储方法的类型
  const allRequests = store.getAll();
  const filteredRequests = store.query({ method: 'GET' });
  
  // 验证清理方法
  store.clear();
  
  console.log('✓ 请求存储 API 类型验证通过');
}

// 测试拦截器 API 类型
function testInterceptorTypes(): void {
  // 验证 HTTP 拦截器类
  HttpPatcher.install();
  HttpPatcher.uninstall();
  
  // 验证 Undici 拦截器类
  UndiciPatcher.install();
  UndiciPatcher.uninstall();
  
  console.log('✓ 拦截器 API 类型验证通过');
}

// 测试 GUI 服务器 API 类型
function testGUIServerTypes(): void {
  // 验证单例获取函数
  const server: IGUIServer = getGUIServer();
  
  // 验证创建函数
  const customServer: IGUIServer = createGUIServer();
  
  console.log('✓ GUI 服务器 API 类型验证通过');
}

// 测试 WebSocket Hub API 类型
function testWebSocketHubTypes(): void {
  // 验证单例获取函数
  const hub: IWebSocketHub = getWebSocketHub();
  
  // 验证创建函数
  const customHub: IWebSocketHub = createWebSocketHub();
  
  console.log('✓ WebSocket Hub API 类型验证通过');
}

// 测试事件桥接 API 类型
function testEventBridgeTypes(): void {
  // 验证单例获取函数
  const bridge: IEventBridge = getEventBridge();
  
  // 验证创建函数
  const customBridge: IEventBridge = createEventBridge();
  
  console.log('✓ 事件桥接 API 类型验证通过');
}

// 测试上下文管理 API 类型
function testContextManagerTypes(): void {
  // 验证 ContextManager 对象的方法
  const traceId: string = ContextManager.generateTraceId();
  const currentContext: TraceContext | undefined = ContextManager.getCurrentContext();
  const currentTraceId: string | undefined = ContextManager.getCurrentTraceId();
  
  // 验证独立导出的工具函数
  const traceId2: string = generateTraceId();
  const currentTraceId2: string | undefined = getCurrentTraceId();
  
  console.log('✓ 上下文管理 API 类型验证通过');
}

// 测试高级 API 类型
function testAdvancedAPITypes(): void {
  // 验证 install 函数类型
  const installPromise: Promise<void> = install();
  
  // 验证 startGUI 函数类型
  const startPromise: Promise<{ url: string; guiPort: number; wsPort: number }> = startGUI({
    guiPort: 'auto',
    wsPort: 'auto',
    autoOpen: false,
  });
  
  // 验证 stopGUI 函数类型
  const stopPromise: Promise<void> = stopGUI();
  
  console.log('✓ 高级 API 类型验证通过');
}

// 测试类型推断
function testTypeInference(): void {
  // 验证配置对象的类型推断
  const config = getConfig();
  const maxRequests = config.maxRequests; // 应该推断为 number
  
  // 验证请求存储的类型推断
  const store = getRequestStore();
  const requests = store.getAll(); // 应该推断为数组
  
  console.log('✓ 类型推断验证通过');
}

// 主测试函数
async function main(): Promise<void> {
  console.log('开始 TypeScript 类型定义测试...\n');
  
  try {
    testConfigTypes();
    testRequestStoreTypes();
    testInterceptorTypes();
    testGUIServerTypes();
    testWebSocketHubTypes();
    testEventBridgeTypes();
    testContextManagerTypes();
    testAdvancedAPITypes();
    testTypeInference();
    
    console.log('\n✅ 所有 TypeScript 类型定义测试通过！');
    console.log('类型定义正确且无错误。');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TypeScript 类型定义测试失败：', error);
    process.exit(1);
  }
}

// 运行测试
main();
