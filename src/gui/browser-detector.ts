/**
 * 浏览器检测器模块
 * 
 * 跨平台检测系统已安装的浏览器（Chrome、Edge、Chromium）
 */

/**
 * 浏览器类型枚举
 */
export enum BrowserType {
  Chrome = 'chrome',
  Edge = 'edge',
  Chromium = 'chromium',
}

/**
 * 浏览器信息接口
 */
export interface BrowserInfo {
  /** 浏览器类型 */
  type: BrowserType;
  /** 浏览器可执行文件路径 */
  path: string;
  /** 浏览器显示名称 */
  name: string;
}

/**
 * 浏览器检测器接口
 */
export interface IBrowserDetector {
  /**
   * 检测系统已安装的浏览器（按优先级返回第一个）
   * 
   * 优先级顺序：Chrome > Edge > Chromium
   * 
   * @returns 浏览器信息，如果未检测到则返回 null
   */
  detect(): BrowserInfo | null;

  /**
   * 检测所有已安装的浏览器
   * 
   * @returns 浏览器信息数组，按优先级排序
   */
  detectAll(): BrowserInfo[];
}

import { existsSync } from 'fs';
import { platform } from 'os';

/**
 * Windows 平台浏览器路径配置
 */
const WINDOWS_BROWSER_PATHS: Record<BrowserType, string[]> = {
  [BrowserType.Chrome]: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ...(process.env.LOCALAPPDATA
      ? [`${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`]
      : []),
  ],
  [BrowserType.Edge]: [
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  [BrowserType.Chromium]: [
    ...(process.env.LOCALAPPDATA
      ? [`${process.env.LOCALAPPDATA}\\Chromium\\Application\\chrome.exe`]
      : []),
  ],
};

/**
 * macOS 平台浏览器路径配置
 */
const MACOS_BROWSER_PATHS: Record<BrowserType, string[]> = {
  [BrowserType.Chrome]: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ...(process.env.HOME
      ? [`${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`]
      : []),
  ],
  [BrowserType.Edge]: [
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  [BrowserType.Chromium]: [
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
};

/**
 * Linux 平台浏览器路径配置
 */
const LINUX_BROWSER_PATHS: Record<BrowserType, string[]> = {
  [BrowserType.Chrome]: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/local/bin/google-chrome',
    '/snap/bin/chromium',
  ],
  [BrowserType.Chromium]: [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ],
  [BrowserType.Edge]: [
    '/usr/bin/microsoft-edge',
  ],
};

/**
 * 浏览器显示名称映射
 */
const BROWSER_NAMES: Record<BrowserType, string> = {
  [BrowserType.Chrome]: 'Google Chrome',
  [BrowserType.Edge]: 'Microsoft Edge',
  [BrowserType.Chromium]: 'Chromium',
};

/**
 * 浏览器优先级顺序（数字越小优先级越高）
 */
const BROWSER_PRIORITY: Record<BrowserType, number> = {
  [BrowserType.Chrome]: 1,
  [BrowserType.Edge]: 2,
  [BrowserType.Chromium]: 3,
};

/**
 * 根据当前平台获取浏览器路径配置
 */
function getBrowserPathsForPlatform(): Record<BrowserType, string[]> {
  const currentPlatform = platform();
  
  switch (currentPlatform) {
    case 'win32':
      return WINDOWS_BROWSER_PATHS;
    case 'darwin':
      return MACOS_BROWSER_PATHS;
    case 'linux':
      return LINUX_BROWSER_PATHS;
    default:
      // 未知平台，返回空配置
      return {
        [BrowserType.Chrome]: [],
        [BrowserType.Edge]: [],
        [BrowserType.Chromium]: [],
      };
  }
}

/**
 * 检测指定类型的浏览器
 * 
 * @param type 浏览器类型
 * @returns 浏览器信息，如果未找到则返回 null
 */
function detectBrowserByType(type: BrowserType): BrowserInfo | null {
  const paths = getBrowserPathsForPlatform()[type];
  
  for (const path of paths) {
    if (existsSync(path)) {
      return {
        type,
        path,
        name: BROWSER_NAMES[type],
      };
    }
  }
  
  return null;
}

/**
 * 浏览器检测器实现类
 */
class BrowserDetector implements IBrowserDetector {
  /**
   * 检测系统已安装的浏览器（按优先级返回第一个）
   */
  detect(): BrowserInfo | null {
    // 优先检查自定义浏览器路径
    const customPath = process.env.NND_BROWSER_PATH;
    if (customPath && existsSync(customPath)) {
      // 尝试从路径推断浏览器类型
      const lowerPath = customPath.toLowerCase();
      let type: BrowserType;
      
      if (lowerPath.includes('chrome') && !lowerPath.includes('chromium')) {
        type = BrowserType.Chrome;
      } else if (lowerPath.includes('edge') || lowerPath.includes('msedge')) {
        type = BrowserType.Edge;
      } else {
        type = BrowserType.Chromium;
      }
      
      return {
        type,
        path: customPath,
        name: BROWSER_NAMES[type],
      };
    }
    
    // 按优先级检测浏览器
    const browserTypes = [
      BrowserType.Chrome,
      BrowserType.Edge,
      BrowserType.Chromium,
    ];
    
    for (const type of browserTypes) {
      const browser = detectBrowserByType(type);
      if (browser) {
        return browser;
      }
    }
    
    return null;
  }

  /**
   * 检测所有已安装的浏览器
   */
  detectAll(): BrowserInfo[] {
    const browsers: BrowserInfo[] = [];
    
    // 检查自定义浏览器路径
    const customPath = process.env.NND_BROWSER_PATH;
    if (customPath && existsSync(customPath)) {
      const lowerPath = customPath.toLowerCase();
      let type: BrowserType;
      
      if (lowerPath.includes('chrome') && !lowerPath.includes('chromium')) {
        type = BrowserType.Chrome;
      } else if (lowerPath.includes('edge') || lowerPath.includes('msedge')) {
        type = BrowserType.Edge;
      } else {
        type = BrowserType.Chromium;
      }
      
      browsers.push({
        type,
        path: customPath,
        name: `${BROWSER_NAMES[type]} (自定义)`,
      });
    }
    
    // 检测所有浏览器类型
    const browserTypes = [
      BrowserType.Chrome,
      BrowserType.Edge,
      BrowserType.Chromium,
    ];
    
    for (const type of browserTypes) {
      const browser = detectBrowserByType(type);
      if (browser) {
        // 避免重复添加自定义路径的浏览器
        if (!browsers.some(b => b.path === browser.path)) {
          browsers.push(browser);
        }
      }
    }
    
    // 按优先级排序
    browsers.sort((a, b) => BROWSER_PRIORITY[a.type] - BROWSER_PRIORITY[b.type]);
    
    return browsers;
  }
}

/**
 * 浏览器检测器单例
 */
let detectorInstance: IBrowserDetector | null = null;

/**
 * 获取浏览器检测器单例
 */
export function getBrowserDetector(): IBrowserDetector {
  if (!detectorInstance) {
    detectorInstance = new BrowserDetector();
  }
  return detectorInstance;
}

/**
 * 创建新的浏览器检测器实例
 */
export function createBrowserDetector(): IBrowserDetector {
  return new BrowserDetector();
}

/**
 * 检测浏览器（便捷函数）
 * 
 * 使用单例检测器检测系统已安装的浏览器
 * 
 * @returns 浏览器信息，如果未检测到则返回 null
 */
export function detectBrowser(): BrowserInfo | null {
  return getBrowserDetector().detect();
}

/**
 * 检测所有浏览器（便捷函数）
 * 
 * 使用单例检测器检测所有已安装的浏览器
 * 
 * @returns 浏览器信息数组，按优先级排序
 */
export function detectAllBrowsers(): BrowserInfo[] {
  return getBrowserDetector().detectAll();
}
