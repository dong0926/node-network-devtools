/**
 * 配置管理模块
 * 
 * 支持通过环境变量和编程方式配置工具行为
 */

/**
 * 浏览器窗口大小配置
 */
export interface BrowserWindowSize {
  /** 窗口宽度（像素） */
  width: number;
  /** 窗口高度（像素） */
  height: number;
}

/**
 * 工具配置接口
 */
export interface Config {
  // 存储配置
  /** 最大存储请求数量，默认 1000 */
  maxRequests: number;
  /** 最大 body 大小（字节），默认 1MB */
  maxBodySize: number;

  // 拦截配置
  /** 是否拦截 http/https 模块，默认 true */
  interceptHttp: boolean;
  /** 是否拦截 undici/fetch，默认 true */
  interceptUndici: boolean;

  // 过滤配置
  /** 忽略的 URL 模式 */
  ignoreUrls: RegExp[];

  // 安全配置
  /** 要脱敏的请求头，默认 ['authorization', 'cookie'] */
  redactHeaders: string[];
  /** 是否禁用 body 捕获，默认 false */
  disableBodyCapture: boolean;

  // GUI 配置
  /** 是否启用 GUI 服务器，默认 true */
  guiEnabled: boolean;
  /** GUI 服务器端口，'auto' 表示自动获取可用端口 */
  guiPort: number | 'auto';
  /** WebSocket 端口，'auto' 表示自动获取可用端口 */
  wsPort: number | 'auto';
  /** GUI 服务器监听地址，默认 '127.0.0.1' */
  guiHost: string;
  /** 是否自动打开浏览器，默认 true */
  autoOpen: boolean;

  // Server Trace 配置
  /** 是否开启服务端全链路追踪，默认 false */
  traceEnabled: boolean;
  /** 每请求最大节点数，默认 5000 */
  traceMaxNodes: number;
  /** 捕获阈值（毫秒），低于此值的节点可能被折叠，默认 2ms */
  traceThresholdMs: number;
  /** 忽略追踪的模块名或路径 */
  traceIgnoredModules: string[];
  
  // 浏览器窗口配置
  /** 浏览器窗口大小，默认 { width: 800, height: 600 } */
  browserWindowSize?: BrowserWindowSize;
  /** 浏览器窗口标题，默认 "Node Network DevTools" */
  browserWindowTitle?: string;
  /** 自定义浏览器可执行文件路径，默认自动检测 */
  browserPath?: string;
}

/**
 * 默认配置
 */
const defaultConfig: Config = {
  maxRequests: 1000,
  maxBodySize: 1024 * 1024, // 1MB
  interceptHttp: true,
  interceptUndici: true,
  ignoreUrls: [],
  redactHeaders: ['authorization', 'cookie'],
  disableBodyCapture: false,
  // GUI 配置默认值
  guiEnabled: true,
  guiPort: 'auto',
  wsPort: 'auto',
  guiHost: '127.0.0.1',
  autoOpen: true,
  // Server Trace 默认配置
  traceEnabled: false,
  traceMaxNodes: 5000,
  traceThresholdMs: 2,
  traceIgnoredModules: ['node_modules', 'node:'],
  // 浏览器窗口默认配置
  browserWindowSize: {
    width: 800,
    height: 600,
  },
  browserWindowTitle: 'Node Network DevTools',
  browserPath: undefined,
};

/**
 * 当前配置（合并后的结果）
 */
let currentConfig: Config = { ...defaultConfig };

/**
 * 从环境变量解析布尔值
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  const lower = value.toLowerCase();
  if (lower === 'true' || lower === '1' || lower === 'yes') return true;
  if (lower === 'false' || lower === '0' || lower === 'no') return false;
  return defaultValue;
}

/**
 * 从环境变量解析数字
 */
function parseEnvNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 从环境变量解析字符串数组（逗号分隔）
 */
function parseEnvStringArray(value: string | undefined, defaultValue: string[]): string[] {
  if (value === undefined || value.trim() === '') return defaultValue;
  return value.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
}

/**
 * 从环境变量解析端口（支持 'auto' 或数字）
 */
function parseEnvPort(value: string | undefined, defaultValue: number | 'auto'): number | 'auto' {
  if (value === undefined) return defaultValue;
  if (value.toLowerCase() === 'auto') return 'auto';
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 从环境变量加载配置
 */
function loadFromEnv(): Partial<Config> {
  const env = process.env;
  
  return {
    maxRequests: parseEnvNumber(env.NND_MAX_REQUESTS, defaultConfig.maxRequests),
    maxBodySize: parseEnvNumber(env.NND_MAX_BODY_SIZE, defaultConfig.maxBodySize),
    interceptHttp: parseEnvBoolean(env.NND_INTERCEPT_HTTP, defaultConfig.interceptHttp),
    interceptUndici: parseEnvBoolean(env.NND_INTERCEPT_UNDICI, defaultConfig.interceptUndici),
    redactHeaders: parseEnvStringArray(env.NND_REDACT_HEADERS, defaultConfig.redactHeaders),
    disableBodyCapture: parseEnvBoolean(env.NND_DISABLE_BODY_CAPTURE, defaultConfig.disableBodyCapture),
    // GUI 配置
    guiEnabled: parseEnvBoolean(env.NND_GUI_ENABLED, defaultConfig.guiEnabled),
    guiPort: parseEnvPort(env.NND_GUI_PORT, defaultConfig.guiPort),
    wsPort: parseEnvPort(env.NND_WS_PORT, defaultConfig.wsPort),
    guiHost: env.NND_GUI_HOST || defaultConfig.guiHost,
    autoOpen: parseEnvBoolean(env.NND_AUTO_OPEN, defaultConfig.autoOpen),
    // Server Trace
    traceEnabled: parseEnvBoolean(env.NND_TRACE_ENABLED, defaultConfig.traceEnabled),
    traceMaxNodes: parseEnvNumber(env.NND_TRACE_MAX_NODES, defaultConfig.traceMaxNodes),
    traceThresholdMs: parseEnvNumber(env.NND_TRACE_THRESHOLD_MS, defaultConfig.traceThresholdMs),
    traceIgnoredModules: parseEnvStringArray(env.NND_TRACE_IGNORED_MODULES, defaultConfig.traceIgnoredModules),
    // 浏览器窗口配置
    browserWindowSize: {
      width: parseEnvNumber(env.NND_BROWSER_WIDTH, defaultConfig.browserWindowSize?.width ?? 800),
      height: parseEnvNumber(env.NND_BROWSER_HEIGHT, defaultConfig.browserWindowSize?.height ?? 600),
    },
    browserWindowTitle: env.NND_BROWSER_TITLE || defaultConfig.browserWindowTitle,
    browserPath: env.NND_BROWSER_PATH,
  };
}

/**
 * 初始化配置（合并默认值和环境变量）
 */
function initConfig(): Config {
  const envConfig = loadFromEnv();
  return {
    ...defaultConfig,
    ...envConfig,
    // ignoreUrls 需要特殊处理，环境变量不支持正则
    ignoreUrls: defaultConfig.ignoreUrls,
  };
}

// 初始化时加载配置
currentConfig = initConfig();

/**
 * 获取当前配置
 */
export function getConfig(): Readonly<Config> {
  return currentConfig;
}

/**
 * 设置配置（合并到当前配置）
 */
export function setConfig(config: Partial<Config>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
  };
}

/**
 * 重置配置为默认值
 */
export function resetConfig(): void {
  currentConfig = initConfig();
}

/**
 * 获取默认配置（用于测试）
 */
export function getDefaultConfig(): Readonly<Config> {
  return defaultConfig;
}
