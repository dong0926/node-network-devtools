/**
 * 浏览器启动器模块
 * 
 * 使用 Puppeteer 以极简窗口模式打开 GUI
 */

import { getConfig } from '../config.js';

/**
 * 浏览器窗口配置
 */
export interface BrowserWindowConfig {
  width: number;
  height: number;
  title: string;
}

/**
 * Puppeteer 未安装错误
 */
export class PuppeteerNotInstalledError extends Error {
  constructor(message?: string) {
    super(message || 'Puppeteer 未安装');
    this.name = 'PuppeteerNotInstalledError';
  }
}

/**
 * Puppeteer 启动失败错误
 */
export class PuppeteerLaunchError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'PuppeteerLaunchError';
  }
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
  private puppeteerBrowser: unknown = null;
  private puppeteerPage: unknown = null;
  private isOpened: boolean = false;

  /**
   * 打开浏览器
   */
  async open(url: string): Promise<void> {
    await this.openWithPuppeteer(url);
    this.isOpened = true;
  }

  /**
   * 构建 Puppeteer 启动参数
   */
  private buildLaunchArgs(url: string, config: BrowserWindowConfig): string[] {
    return [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--app=${url}`,  // 关键：app 模式，无地址栏和工具栏
      `--window-size=${config.width},${config.height}`,
      '--disable-features=TranslateUI',
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--disable-default-apps',
      '--mute-audio',
      '--no-first-run',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-ipc-flooding-protection',
      '--password-store=basic',
      '--use-mock-keychain',
    ];
  }

  /**
   * 处理 Puppeteer 未安装错误
   */
  private handlePuppeteerNotInstalled(guiUrl: string): void {
    console.error(`
[node-network-devtools] 错误：Puppeteer 未安装

请安装 Puppeteer：
  pnpm add puppeteer
  # 或
  npm install puppeteer
  # 或
  yarn add puppeteer

或禁用自动打开浏览器：
  NND_AUTO_OPEN=false node --import node-network-devtools/register app.js

GUI 仍可通过浏览器访问：${guiUrl}
    `);
  }

  /**
   * 处理 Puppeteer 启动失败错误
   */
  private handlePuppeteerLaunchError(err: Error, guiUrl: string): void {
    console.error(`
[node-network-devtools] 错误：无法启动浏览器

错误信息：${err.message}

可能的原因：
1. 缺少系统依赖（Chrome/Chromium）
2. 权限不足
3. 端口被占用

解决方案：
- 安装 Chrome/Chromium
- 使用 NND_AUTO_OPEN=false 禁用自动打开
- 手动访问 GUI: ${guiUrl}

详细错误：
${err.stack}
    `);
  }

  /**
   * 检测是否在 Webpack 打包环境中
   */
  private isWebpackEnvironment(): boolean {
    // 检测 webpack 特有的全局变量
    if (typeof (globalThis as any).__webpack_require__ !== 'undefined') {
      return true;
    }
    
    // 检测 Next.js 的 webpack-internal 路径
    if (typeof Error.captureStackTrace === 'function') {
      const stack = new Error().stack || '';
      if (stack.includes('webpack-internal://') || stack.includes('.next/server/')) {
        return true;
      }
    }
    
    // 检测 process.env 中的 Next.js 标识
    if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.__NEXT_PROCESSED_ENV) {
      return true;
    }
    
    return false;
  }

  /**
   * 使用 Puppeteer 打开极简窗口
   */
  private async openWithPuppeteer(url: string): Promise<void> {
    // 检测 Webpack 环境，自动降级
    if (this.isWebpackEnvironment()) {
      console.warn(`
[node-network-devtools] 检测到 Webpack 打包环境（Next.js/其他）

由于 Webpack 打包限制，无法自动打开浏览器。
GUI 服务器已启动，请手动访问：${url}

提示：你可以在配置中设置 autoOpen: false 来禁用此警告。
      `);
      // 不抛出错误，静默失败
      return;
    }

    try {
      // 尝试动态导入 Puppeteer
      let puppeteer: any;
      try {
        puppeteer = await import('puppeteer');
      } catch (importErr) {
        // 如果是模块未找到错误，提示用户
        if ((importErr as any).code === 'MODULE_NOT_FOUND' || (importErr as any).code === 'ERR_MODULE_NOT_FOUND') {
          this.handlePuppeteerNotInstalled(url);
          throw new PuppeteerNotInstalledError('Puppeteer 未安装。请运行: pnpm add puppeteer');
        }
        // 其他导入错误也视为未安装
        this.handlePuppeteerNotInstalled(url);
        throw new PuppeteerNotInstalledError(`Puppeteer 导入失败: ${(importErr as Error).message}`);
      }

      // 获取窗口配置
      const config = getConfig();
      const windowConfig: BrowserWindowConfig = {
        width: config.browserWindowSize?.width ?? 800,
        height: config.browserWindowSize?.height ?? 600,
        title: config.browserWindowTitle ?? 'Node Network DevTools',
      };

      // 构建启动参数
      const args = this.buildLaunchArgs(url, windowConfig);

      // 启动浏览器
      this.puppeteerBrowser = await puppeteer.default.launch({
        headless: false,
        defaultViewport: null,
        args,
      });

      // 获取第一个页面（app 模式会自动创建）
      const browser = this.puppeteerBrowser as { pages: () => Promise<unknown[]> };
      const pages = await browser.pages();
      this.puppeteerPage = pages[0];

      // 设置页面标题
      const page = this.puppeteerPage as { evaluate: (fn: string, title: string) => Promise<void> };
      await page.evaluate(`(title) => { document.title = title; }`, windowConfig.title);

      console.log(`[node-network-devtools] 已启动 Puppeteer 窗口: ${url}`);
    } catch (err) {
      if (err instanceof PuppeteerNotInstalledError) {
        throw err;
      }
      this.handlePuppeteerLaunchError(err as Error, url);
      throw new PuppeteerLaunchError('无法启动 Puppeteer 浏览器', err as Error);
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.puppeteerBrowser) {
      try {
        const browser = this.puppeteerBrowser as { close: () => Promise<void> };
        await browser.close();
      } catch {
        // 忽略关闭错误
      }
      this.puppeteerBrowser = null;
      this.puppeteerPage = null;
    }
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
 * 导出 buildLaunchArgs 用于测试
 */
export function buildLaunchArgs(url: string, config: BrowserWindowConfig): string[] {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    `--app=${url}`,
    `--window-size=${config.width},${config.height}`,
    '--disable-features=TranslateUI',
    '--disable-extensions',
    '--disable-component-extensions-with-background-pages',
    '--disable-background-networking',
    '--disable-sync',
    '--metrics-recording-only',
    '--disable-default-apps',
    '--mute-audio',
    '--no-first-run',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-ipc-flooding-protection',
    '--password-store=basic',
    '--use-mock-keychain',
  ];
}
