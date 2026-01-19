/**
 * 浏览器启动器模块
 * 
 * 使用原生浏览器检测和启动机制打开 GUI
 */

import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { getConfig } from '../config.js';
import { detectBrowser } from './browser-detector.js';

/**
 * 浏览器未检测到错误
 * 
 * 当系统中未检测到任何支持的浏览器时抛出此错误
 */
export class BrowserNotFoundError extends Error {
  constructor() {
    super('未检测到已安装的浏览器');
    this.name = 'BrowserNotFoundError';
    // 保持原型链正确（TypeScript 继承 Error 的最佳实践）
    Object.setPrototypeOf(this, BrowserNotFoundError.prototype);
  }
}

/**
 * 浏览器启动失败错误
 * 
 * 当浏览器启动过程中发生错误时抛出此错误
 */
export class BrowserLaunchError extends Error {
  /**
   * @param message 错误消息
   * @param cause 原始错误（可选）
   */
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'BrowserLaunchError';
    // 保持原型链正确（TypeScript 继承 Error 的最佳实践）
    Object.setPrototypeOf(this, BrowserLaunchError.prototype);
  }
}

/**
 * 浏览器窗口配置
 */
export interface BrowserWindowConfig {
  width: number;
  height: number;
  title: string;
}

/**
 * 浏览器启动选项
 */
export interface BrowserLaunchOptions {
  url: string;
  windowConfig: BrowserWindowConfig;
  userDataDir?: string;
}

/**
 * 浏览器启动器接口
 */
export interface IBrowserLauncher {
  open(url: string): Promise<void>;
  close(): Promise<void>;
  isOpen(): boolean;
}

/**
 * 浏览器启动器实现
 */
class BrowserLauncherImpl implements IBrowserLauncher {
  private isOpened: boolean = false;

  /**
   * 打开浏览器
   * 
   * 执行以下步骤：
   * 1. 调用 BrowserDetector.detect() 检测浏览器
   * 2. 处理未找到浏览器的情况
   * 3. 构建启动参数
   * 4. 调用启动逻辑
   * 5. 处理启动失败的情况
   * 
   * @param url GUI 访问 URL
   * 
   * @remarks
   * 此方法不会抛出异常，所有错误都会被捕获并显示友好的错误消息。
   * 这确保浏览器启动失败不会中断主进程。
   * 
   * **验证需求：2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.4**
   */
  async open(url: string): Promise<void> {
    try {
      // 步骤 1: 调用 BrowserDetector.detect() 检测浏览器
      const browserInfo = detectBrowser();
      
      // 步骤 2: 处理未找到浏览器的情况
      if (!browserInfo) {
        // 浏览器未找到，显示友好提示（需求 6.1）
        this.handleBrowserNotFound(url);
        return;
      }
      
      // 获取配置
      const config = getConfig();
      const windowConfig: BrowserWindowConfig = {
        width: config.browserWindowSize?.width || 1280,
        height: config.browserWindowSize?.height || 800,
        title: config.browserWindowTitle || 'Node Network DevTools',
      };
      
      // 创建用户数据目录（需求 4.2）
      const userDataDir = createUserDataDir();
      
      // 步骤 3: 构建启动参数（需求 4.1）
      const args = this.buildLaunchArgs({
        url,
        windowConfig,
        userDataDir,
      });
      
      // 步骤 4: 调用启动逻辑（需求 4.3, 4.4, 4.5）
      this.launchBrowser(browserInfo.path, args);
      
      this.isOpened = true;
      
      console.log(`[node-network-devtools] 已使用 ${browserInfo.name} 打开 GUI: ${url}`);
    } catch (err) {
      // 步骤 5: 处理启动失败的情况（需求 6.4）
      this.handleLaunchError(err as Error, url);
    }
  }

  /**
   * 启动浏览器进程
   * 
   * 使用 child_process.spawn() 启动浏览器，并配置为分离进程。
   * 这样浏览器进程不会阻塞父进程，父进程退出后浏览器仍可继续运行。
   * 
   * @param browserPath 浏览器可执行文件路径
   * @param args 启动参数数组
   * @throws {BrowserLaunchError} 当浏览器启动失败时抛出
   * 
   * @remarks
   * 进程配置：
   * - detached: true - 进程分离，允许父进程退出（需求 4.3）
   * - stdio: 'ignore' - 忽略标准输入输出，避免管道阻塞（需求 4.4）
   * - child.unref() - 允许父进程退出而不等待子进程（需求 4.5）
   * 
   * **验证需求：4.3, 4.4, 4.5**
   */
  private launchBrowser(browserPath: string, args: string[]): void {
    try {
      // 启动分离进程
      const child = spawn(browserPath, args, {
        detached: true,      // 进程分离，允许父进程退出（需求 4.3）
        stdio: 'ignore',     // 忽略标准输入输出，避免管道阻塞（需求 4.4）
      });
      
      // 允许父进程退出而不等待子进程（需求 4.5）
      child.unref();
      
      // 监听错误事件（虽然 stdio: 'ignore'，但 spawn 本身可能失败）
      child.on('error', (err) => {
        throw new BrowserLaunchError(`浏览器进程启动失败: ${err.message}`, err);
      });
    } catch (err) {
      // 将原始错误包装为 BrowserLaunchError
      if (err instanceof BrowserLaunchError) {
        throw err;
      }
      throw new BrowserLaunchError(
        `无法启动浏览器: ${(err as Error).message}`,
        err as Error
      );
    }
  }

  /**
   * 处理浏览器未找到的情况
   * 
   * 显示友好的错误消息，包含：
   * - 支持的浏览器列表
   * - GUI 访问 URL（需求 6.2）
   * - 自定义浏览器路径设置说明
   * - 浏览器安装指引链接（需求 6.3）
   * 
   * @param guiUrl GUI 访问 URL
   * 
   * **验证需求：6.1, 6.2, 6.3**
   */
  private handleBrowserNotFound(guiUrl: string): void {
    console.error(`
[node-network-devtools] 未检测到已安装的浏览器

支持的浏览器：
  - Google Chrome
  - Microsoft Edge
  - Chromium

请安装其中一个浏览器，或手动访问 GUI：
  ${guiUrl}

自定义浏览器路径：
  export NND_BROWSER_PATH=/path/to/browser

浏览器安装指引：
  Chrome: https://www.google.com/chrome/
  Edge: https://www.microsoft.com/edge
  更多信息: https://github.com/dong0926/node-network-devtools#readme
    `);
  }

  /**
   * 处理浏览器启动失败的情况
   * 
   * 显示友好的错误消息，包含：
   * - 错误信息（需求 6.4）
   * - 可能的原因分析
   * - 解决方案建议（需求 6.5）
   * - 手动访问 URL 提示
   * 
   * @param err 错误对象
   * @param guiUrl GUI 访问 URL
   * 
   * **验证需求：6.4, 6.5**
   */
  private handleLaunchError(err: Error, guiUrl: string): void {
    console.error(`
[node-network-devtools] 浏览器启动失败

错误信息：${err.message}

可能的原因：
  1. 浏览器路径无效
  2. 权限不足
  3. 系统资源不足

解决方案：
  - 手动访问 GUI: ${guiUrl}
  - 设置 NND_AUTO_OPEN=false 禁用自动打开
  - 检查浏览器是否正确安装
  - 尝试设置自定义浏览器路径: export NND_BROWSER_PATH=/path/to/browser
    `);
  }

  /**
   * 构建浏览器启动参数
   * 
   * @param options 启动选项
   * @returns Chrome 命令行参数数组
   */
  private buildLaunchArgs(options: BrowserLaunchOptions): string[] {
    const { url, windowConfig, userDataDir } = options;
    
    const args = [
      // App 模式（极简窗口，无地址栏和工具栏）
      `--app=${url}`,
      
      // 窗口大小
      `--window-size=${windowConfig.width},${windowConfig.height}`,
    ];
    
    // 用户数据目录（如果提供）
    if (userDataDir) {
      args.push(`--user-data-dir=${userDataDir}`);
    }
    
    // 优化参数
    args.push(
      '--no-first-run',                    // 跳过首次运行向导
      '--no-default-browser-check',        // 跳过默认浏览器检查
      '--disable-extensions',              // 禁用扩展
      '--disable-sync',                    // 禁用同步
      '--disable-background-networking',   // 禁用后台网络请求
      '--disable-features=TranslateUI',    // 禁用翻译 UI
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',            // 禁用默认应用
      '--mute-audio',                      // 静音
      
      // 性能优化
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      
      // 安全相关（某些环境需要）
      '--no-sandbox',
      '--disable-setuid-sandbox',
    );
    
    return args;
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    // TODO: 实现浏览器关闭逻辑（注：由于进程分离，实际无法关闭）
    this.isOpened = false;
  }

  /**
   * 检查浏览器是否已打开
   */
  isOpen(): boolean {
    return this.isOpened;
  }
}

// 全局单例
let globalLauncher: BrowserLauncherImpl | null = null;

/**
 * 获取全局浏览器启动器实例
 */
export function getBrowserLauncher(): IBrowserLauncher {
  if (!globalLauncher) {
    globalLauncher = new BrowserLauncherImpl();
  }
  return globalLauncher;
}

/**
 * 重置全局浏览器启动器（用于测试）
 */
export async function resetBrowserLauncher(): Promise<void> {
  if (globalLauncher) {
    await globalLauncher.close();
  }
  globalLauncher = null;
}

/**
 * 创建新的浏览器启动器实例（用于测试）
 */
export function createBrowserLauncher(): IBrowserLauncher {
  return new BrowserLauncherImpl();
}

/**
 * 构建带 WebSocket 端口参数的 GUI URL
 */
export function buildGUIUrl(host: string, guiPort: number, wsPort: number): string {
  return `http://${host}:${guiPort}?wsPort=${wsPort}`;
}

/**
 * 打开浏览器（便捷函数）
 */
export async function openBrowser(url: string): Promise<void> {
  const launcher = getBrowserLauncher();
  await launcher.open(url);
}

/**
 * 关闭浏览器（便捷函数）
 */
export async function closeBrowser(): Promise<void> {
  const launcher = getBrowserLauncher();
  await launcher.close();
}

/**
 * 构建浏览器启动参数（导出用于测试）
 * 
 * @param options 启动选项
 * @returns Chrome 命令行参数数组
 */
export function buildLaunchArgs(options: BrowserLaunchOptions): string[] {
  const { url, windowConfig, userDataDir } = options;
  
  const args = [
    // App 模式（极简窗口，无地址栏和工具栏）
    `--app=${url}`,
    
    // 窗口大小
    `--window-size=${windowConfig.width},${windowConfig.height}`,
  ];
  
  // 用户数据目录（如果提供）
  if (userDataDir) {
    args.push(`--user-data-dir=${userDataDir}`);
  }
  
  // 优化参数
  args.push(
    '--no-first-run',                    // 跳过首次运行向导
    '--no-default-browser-check',        // 跳过默认浏览器检查
    '--disable-extensions',              // 禁用扩展
    '--disable-sync',                    // 禁用同步
    '--disable-background-networking',   // 禁用后台网络请求
    '--disable-features=TranslateUI',    // 禁用翻译 UI
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',            // 禁用默认应用
    '--mute-audio',                      // 静音
    
    // 性能优化
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    
    // 安全相关（某些环境需要）
    '--no-sandbox',
    '--disable-setuid-sandbox',
  );
  
  return args;
}

/**
 * 创建用户数据目录路径
 * 
 * 生成一个唯一的临时目录路径用于浏览器用户数据。
 * 使用 nanoid 生成 8 位随机 ID 确保每次启动都使用独立的会话。
 * 
 * @returns 用户数据目录的完整路径，格式：`{tmpdir}/nnd-browser-{sessionId}`
 * 
 * @example
 * ```typescript
 * const userDataDir = createUserDataDir();
 * // 返回类似：/tmp/nnd-browser-a1b2c3d4
 * ```
 */
export function createUserDataDir(): string {
  const sessionId = nanoid(8);
  return join(tmpdir(), `nnd-browser-${sessionId}`);
}
