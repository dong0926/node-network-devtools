/**
 * 浏览器启动器模块
 * 
 * 支持使用系统默认浏览器或 Puppeteer 打开 GUI
 */

import { getConfig } from '../config.js';

/**
 * 浏览器启动器配置
 */
export interface BrowserLauncherConfig {
  useDefaultBrowser: boolean;
  usePuppeteer: boolean;
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
    const config = getConfig();

    if (config.usePuppeteer) {
      await this.openWithPuppeteer(url);
    } else {
      await this.openWithDefaultBrowser(url);
    }

    this.isOpened = true;
  }

  /**
   * 使用系统默认浏览器打开
   */
  private async openWithDefaultBrowser(url: string): Promise<void> {
    try {
      // 动态导入 open 包
      const openModule = await import('open');
      const open = openModule.default;
      await open(url);
      console.log(`[node-network-devtools] 已在默认浏览器中打开: ${url}`);
    } catch (err) {
      console.error('[node-network-devtools] 无法打开默认浏览器:', err);
      throw err;
    }
  }

  /**
   * 使用 Puppeteer 打开
   */
  private async openWithPuppeteer(url: string): Promise<void> {
    try {
      // 动态导入 puppeteer（可选依赖）
      const puppeteer = await import('puppeteer');
      
      // 启动浏览器
      this.puppeteerBrowser = await puppeteer.default.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          `--window-size=1200,800`,
        ],
      });

      // 创建新页面
      const browser = this.puppeteerBrowser as { newPage: () => Promise<unknown> };
      this.puppeteerPage = await browser.newPage();

      // 导航到 URL
      const page = this.puppeteerPage as { goto: (url: string) => Promise<void> };
      await page.goto(url);

      console.log(`[node-network-devtools] 已使用 Puppeteer 打开: ${url}`);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
        console.error('[node-network-devtools] Puppeteer 未安装，请运行: pnpm add puppeteer');
        // 回退到默认浏览器
        console.log('[node-network-devtools] 回退到默认浏览器...');
        await this.openWithDefaultBrowser(url);
      } else {
        console.error('[node-network-devtools] Puppeteer 启动失败:', err);
        throw err;
      }
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
 * 浏览器启动选项
 */
export interface BrowserLauncherOptions {
  /** 是否使用 Puppeteer */
  usePuppeteer?: boolean;
}

/**
 * 打开浏览器（便捷函数）
 */
export async function openBrowser(url: string, options?: BrowserLauncherOptions): Promise<void> {
  const launcher = getBrowserLauncher();
  
  // 如果指定了 usePuppeteer，临时修改配置
  if (options?.usePuppeteer !== undefined) {
    const { setConfig, getConfig } = await import('../config.js');
    const originalConfig = getConfig();
    setConfig({ usePuppeteer: options.usePuppeteer });
    try {
      await launcher.open(url);
    } finally {
      setConfig({ usePuppeteer: originalConfig.usePuppeteer });
    }
  } else {
    await launcher.open(url);
  }
}

/**
 * 关闭浏览器（便捷函数）
 */
export async function closeBrowser(): Promise<void> {
  const launcher = getBrowserLauncher();
  await launcher.close();
}
