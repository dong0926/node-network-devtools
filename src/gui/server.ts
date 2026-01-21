/**
 * GUI Server 模块
 * 
 * 提供 HTTP 静态文件服务和 WebSocket 实时通信
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from '../config.js';
import { getAvailablePort } from './port-utils.js';
import { getWebSocketHub, type IWebSocketHub } from './websocket-hub.js';
import { getEventBridge, type IEventBridge } from './event-bridge.js';

// 获取当前模块目录
// 在 CommonJS 中，__dirname 是全局可用的
// 在 ESM 中，需要使用 import.meta.url
// 为了避免在 CJS 构建中出现 import.meta 引用，我们使用 eval 来延迟求值
let currentDirname: string;

// @ts-ignore - __dirname 在 CommonJS 中可用
if (typeof __dirname !== 'undefined') {
  // CommonJS 环境
  // @ts-ignore
  currentDirname = __dirname;
} else {
  // ESM 环境 - 使用 eval 来避免 TypeScript 编译器处理 import.meta
  try {
    // eslint-disable-next-line no-eval
    const importMetaUrl = eval('import.meta.url');
    currentDirname = dirname(fileURLToPath(importMetaUrl));
  } catch (error) {
    // 后备方案：尝试从 module 路径推断
    // 这种情况不应该发生，但作为最后的后备
    console.error('[GUI Server] 无法确定模块目录，使用 process.cwd() 作为后备:', error);
    currentDirname = process.cwd();
  }
}

/**
 * GUI 服务器配置
 */
export interface GUIServerConfig {
  guiPort: number | 'auto';
  wsPort: number | 'auto';
  host: string;
  enabled: boolean;
  autoOpen: boolean;
}

/**
 * GUI 服务器接口
 */
export interface IGUIServer {
  start(options?: {
    guiPort?: number | 'auto';
    wsPort?: number | 'auto';
    host?: string;
  }): Promise<{ guiPort: number; wsPort: number; url: string }>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getUrl(): string | null;
  getGuiPort(): number | null;
  getWsPort(): number | null;
}

/**
 * MIME 类型映射
 */
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

/**
 * GUI Server 实现
 */
class GUIServerImpl implements IGUIServer {
  private server: Server | null = null;
  private wsHub: IWebSocketHub;
  private eventBridge: IEventBridge;
  private guiPort: number | null = null;
  private wsPort: number | null = null;
  private host: string;
  private staticDir: string;

  constructor(
    wsHub?: IWebSocketHub,
    eventBridge?: IEventBridge,
    host: string = '127.0.0.1'
  ) {
    this.wsHub = wsHub ?? getWebSocketHub();
    this.eventBridge = eventBridge ?? getEventBridge();
    this.host = host;
    // 静态文件目录：dist/gui（构建后的前端文件）
    // 我们需要确保在不同环境下都能找到该目录：
    // 1. 开发环境运行 tsx: currentDirname 是 src/gui，路径应为 ../../dist/gui
    // 2. 编译后运行: currentDirname 是 dist/esm/gui 或 dist/cjs/gui，路径应为 ../../gui
    
    const possiblePaths = [
      join(currentDirname, '../../gui'), // 编译后路径
      join(currentDirname, '../../../dist/gui'), // 开发环境(tsx)路径
      join(process.cwd(), 'dist/gui'), // 后备路径
    ];

    this.staticDir = possiblePaths[0];
    for (const p of possiblePaths) {
      if (existsSync(p) && existsSync(join(p, 'index.html'))) {
        this.staticDir = p;
        break;
      }
    }
  }

  /**
   * 启动 GUI 服务器
   */
  async start(options?: {
    guiPort?: number | 'auto';
    wsPort?: number | 'auto';
    host?: string;
  }): Promise<{ guiPort: number; wsPort: number; url: string }> {
    if (this.server) {
      throw new Error('GUI Server 已经在运行');
    }

    const config = getConfig();

    // 使用传入的选项或配置中的值
    const guiPortConfig = options?.guiPort ?? config.guiPort;
    const wsPortConfig = options?.wsPort ?? config.wsPort;
    const hostConfig = options?.host ?? config.guiHost;

    // 更新 host
    this.host = hostConfig;

    // 获取可用端口
    this.guiPort = await getAvailablePort(guiPortConfig, this.host);
    this.wsPort = await getAvailablePort(wsPortConfig, this.host);

    // 启动 WebSocket Hub
    await this.wsHub.start(this.wsPort, this.host);

    // 启动 Event Bridge
    this.eventBridge.start();

    // 创建 HTTP 服务器
    this.server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // 启动 HTTP 服务器
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(this.guiPort as number, this.host, () => {
        resolve();
      });
    });

    const url = this.getUrl()!;
    console.log(`[node-network-devtools] GUI 服务器已启动: ${url}`);

    return {
      guiPort: this.guiPort,
      wsPort: this.wsPort,
      url,
    };
  }

  /**
   * 处理 HTTP 请求
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${this.host}:${this.guiPort}`);
    let pathname = url.pathname;

    console.log(`[GUI Server] 请求: ${pathname}, 静态目录: ${this.staticDir}`);

    // 默认路径指向 index.html
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // 构建文件路径
    const filePath = join(this.staticDir, pathname);
    console.log(`[GUI Server] 文件路径: ${filePath}`);

    try {
      // 检查文件是否存在
      const fileStat = await stat(filePath);
      
      if (!fileStat.isFile()) {
        // 如果不是文件，尝试返回 index.html（SPA 路由支持）
        await this.serveFile(join(this.staticDir, 'index.html'), res);
        return;
      }

      await this.serveFile(filePath, res);
    } catch (err) {
      console.log(`[GUI Server] 文件不存在: ${filePath}, 错误:`, err);
      // 文件不存在，尝试返回 index.html（SPA 路由支持）
      try {
        await this.serveFile(join(this.staticDir, 'index.html'), res);
      } catch (indexErr) {
        console.log(`[GUI Server] index.html 也不存在:`, indexErr);
        this.sendError(res, 404, 'Not Found');
      }
    }
  }

  /**
   * 提供静态文件
   */
  private async serveFile(filePath: string, res: ServerResponse): Promise<void> {
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const content = await readFile(filePath);
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  }

  /**
   * 发送错误响应
   */
  private sendError(res: ServerResponse, statusCode: number, message: string): void {
    res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
  }

  /**
   * 停止 GUI 服务器
   */
  async stop(): Promise<void> {
    // 停止 Event Bridge
    this.eventBridge.stop();

    // 停止 WebSocket Hub
    await this.wsHub.stop();

    // 停止 HTTP 服务器
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          resolve();
        });
      });
      this.server = null;
    }

    this.guiPort = null;
    this.wsPort = null;
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * 获取 GUI URL
   */
  getUrl(): string | null {
    if (!this.guiPort || !this.wsPort) return null;
    return `http://${this.host}:${this.guiPort}?wsPort=${this.wsPort}`;
  }

  /**
   * 获取 GUI 端口
   */
  getGuiPort(): number | null {
    return this.guiPort;
  }

  /**
   * 获取 WebSocket 端口
   */
  getWsPort(): number | null {
    return this.wsPort;
  }
}

// 全局单例
let globalServer: GUIServerImpl | null = null;

/**
 * 获取全局 GUI Server 实例
 */
export function getGUIServer(): IGUIServer {
  if (!globalServer) {
    globalServer = new GUIServerImpl();
  }
  return globalServer;
}

/**
 * 重置全局 GUI Server（用于测试）
 */
export async function resetGUIServer(): Promise<void> {
  if (globalServer) {
    await globalServer.stop();
  }
  globalServer = null;
}

/**
 * 创建新的 GUI Server 实例（用于测试）
 */
export function createGUIServer(
  wsHub?: IWebSocketHub,
  eventBridge?: IEventBridge,
  host?: string
): IGUIServer {
  return new GUIServerImpl(wsHub, eventBridge, host);
}
