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
import { createRequire } from 'node:module';
import { getConfig } from '../config.js';
import { getAvailablePort } from './port-utils.js';
import { getWebSocketHub, type IWebSocketHub } from './websocket-hub.js';
import { getEventBridge, type IEventBridge } from './event-bridge.js';
// @ts-ignore - 资产文件由脚本生成
import { assets } from './assets.gen.js';

// 获取当前模块目录
let currentDirname: string;
try {
  // @ts-ignore
  if (typeof __dirname !== 'undefined') {
    // @ts-ignore
    currentDirname = __dirname;
  } else {
    currentDirname = dirname(fileURLToPath(eval('import.meta.url')));
  }
} catch {
  currentDirname = process.cwd();
}

/**
 * 寻找静态资源目录
 */
function resolveStaticDir(): string {
  // 1. 优先使用环境变量
  if (process.env.NND_GUI_DIR && existsSync(process.env.NND_GUI_DIR)) {
    return process.env.NND_GUI_DIR;
  }

  // 2. 尝试相对路径（基于包的固定结构）
  const paths = [
    join(currentDirname, '../../gui'),          // 编译后: dist/esm/gui/ -> dist/gui
    join(currentDirname, '../../../dist/gui'),  // 开发中: src/gui/ -> dist/gui
  ];

  for (const p of paths) {
    if (existsSync(join(p, 'index.html'))) {
      return p;
    }
  }

  // 3. 兜底：通过包名解析（适用于打包工具处理了 import.meta 的情况）
  try {
    let pkgPath: string;
    // @ts-ignore
    if (typeof require !== 'undefined' && typeof require.resolve === 'function') {
      // @ts-ignore
      pkgPath = require.resolve('@mt0926/node-network-devtools/package.json');
    } else {
      const req = createRequire(eval('import.meta.url'));
      pkgPath = req.resolve('@mt0926/node-network-devtools/package.json');
    }
    const p = join(dirname(pkgPath), 'dist/gui');
    if (existsSync(join(p, 'index.html'))) return p;
  } catch {}

  // 最终兜底使用第一个路径
  return paths[0];
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
    
    // 解析静态资源目录
    this.staticDir = resolveStaticDir();
    
    if (!existsSync(join(this.staticDir, 'index.html'))) {
      console.warn(`[GUI Server] 警告: 未能找到 GUI 静态资源。尝试路径: ${this.staticDir}`);
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

    // 默认路径指向 index.html
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // 1. 优先尝试从内存（嵌入资产）中查找
    if (assets && assets[pathname]) {
      const asset = assets[pathname];
      console.log(`[GUI Server] 从内存提供资产: ${pathname}`);
      res.writeHead(200, {
        'Content-Type': asset.contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(Buffer.from(asset.content, 'base64'));
      return;
    }

    // 2. 如果内存中没有（可能是开发环境），则尝试从文件系统查找
    console.log(`[GUI Server] 内存中未找到 ${pathname}，尝试文件系统: ${this.staticDir}`);

    // 构建文件路径
    const filePath = join(this.staticDir, pathname);
    console.log(`[GUI Server] 文件路径: ${filePath}`);

    try {
      // 检查文件是否存在
      const fileStat = await stat(filePath);
      
      if (!fileStat.isFile()) {
        // 如果不是文件，尝试返回 index.html（SPA 路由支持）
        const indexPath = join(this.staticDir, 'index.html');
        if (existsSync(indexPath)) {
          await this.serveFile(indexPath, res);
        } else {
          throw new Error(`Index file not found: ${indexPath}`);
        }
        return;
      }

      await this.serveFile(filePath, res);
    } catch (err) {
      // 文件不存在，尝试返回 index.html（SPA 路由支持）
      const indexPath = join(this.staticDir, 'index.html');
      try {
        if (!existsSync(indexPath)) {
          throw new Error(`Index file not found: ${indexPath}`);
        }
        await this.serveFile(indexPath, res);
      } catch (indexErr) {
        console.error(`[GUI Server] 错误: 无法提供文件 ${pathname}`);
        console.error(`[GUI Server] 尝试路径: ${filePath}`);
        console.error(`[GUI Server] 尝试 Index 路径: ${indexPath}`);
        console.error(`[GUI Server] 当前静态目录配置: ${this.staticDir}`);
        console.error(`[GUI Server] 提示: 如果路径不正确，请设置环境变量 NND_GUI_DIR`);
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
