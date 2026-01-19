/**
 * 浏览器检测器单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync } from 'fs';
import { platform } from 'os';
import {
  BrowserType,
  type BrowserInfo,
  getBrowserDetector,
  createBrowserDetector,
} from './browser-detector.js';

// Mock fs 和 os 模块
vi.mock('fs');
vi.mock('os');

describe('BrowserDetector', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 保存原始环境变量
    originalEnv = { ...process.env };
    // 清除自定义浏览器路径
    delete process.env.NND_BROWSER_PATH;
    // 重置 mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 恢复环境变量
    process.env = originalEnv;
  });

  describe('Windows 平台', () => {
    beforeEach(() => {
      vi.mocked(platform).mockReturnValue('win32');
      process.env.LOCALAPPDATA = 'C:\\Users\\Test\\AppData\\Local';
    });

    it('应该检测到 Program Files 中的 Chrome', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chrome);
      expect(result?.path).toBe('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
      expect(result?.name).toBe('Google Chrome');
    });

    it('应该检测到 Program Files (x86) 中的 Chrome', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chrome);
      expect(result?.path).toBe('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
    });

    it('应该检测到 LOCALAPPDATA 中的 Chrome', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === 'C:\\Users\\Test\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chrome);
      expect(result?.path).toBe('C:\\Users\\Test\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe');
    });

    it('应该检测到 Program Files 中的 Edge', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Edge);
      expect(result?.path).toBe('C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe');
      expect(result?.name).toBe('Microsoft Edge');
    });

    it('应该检测到 Program Files (x86) 中的 Edge', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Edge);
      expect(result?.path).toBe('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
    });

    it('应该检测到 LOCALAPPDATA 中的 Chromium', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === 'C:\\Users\\Test\\AppData\\Local\\Chromium\\Application\\chrome.exe';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chromium);
      expect(result?.path).toBe('C:\\Users\\Test\\AppData\\Local\\Chromium\\Application\\chrome.exe');
      expect(result?.name).toBe('Chromium');
    });

    it('应该按 Chrome > Edge > Chromium 优先级返回', () => {
      // 所有浏览器都存在
      vi.mocked(existsSync).mockReturnValue(true);

      const detector = createBrowserDetector();
      const result = detector.detect();

      // 应该返回 Chrome（最高优先级）
      expect(result?.type).toBe(BrowserType.Chrome);
    });

    it('当 Chrome 不存在时应该返回 Edge', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path);
        // Chrome 不存在，Edge 存在
        return pathStr.includes('Edge') || pathStr.includes('msedge');
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result?.type).toBe(BrowserType.Edge);
    });

    it('当 Chrome 和 Edge 都不存在时应该返回 Chromium', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path);
        // 只有 Chromium 存在
        return pathStr.includes('Chromium');
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result?.type).toBe(BrowserType.Chromium);
    });

    it('当没有浏览器时应该返回 null', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).toBeNull();
    });
  });

  describe('macOS 平台', () => {
    beforeEach(() => {
      vi.mocked(platform).mockReturnValue('darwin');
      process.env.HOME = '/Users/test';
    });

    it('应该检测到 /Applications 中的 Chrome', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chrome);
      expect(result?.path).toBe('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    });

    it('应该检测到用户 Applications 中的 Chrome', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/Users/test/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chrome);
    });

    it('应该检测到 Edge', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Edge);
    });

    it('应该检测到 Chromium', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/Applications/Chromium.app/Contents/MacOS/Chromium';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chromium);
    });
  });

  describe('Linux 平台', () => {
    beforeEach(() => {
      vi.mocked(platform).mockReturnValue('linux');
    });

    it('应该检测到 /usr/bin/google-chrome', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/usr/bin/google-chrome';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chrome);
      expect(result?.path).toBe('/usr/bin/google-chrome');
    });

    it('应该检测到 /usr/bin/google-chrome-stable', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/usr/bin/google-chrome-stable';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chrome);
    });

    it('应该检测到 /usr/bin/chromium', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/usr/bin/chromium';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Chromium);
    });

    it('应该检测到 /usr/bin/microsoft-edge', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/usr/bin/microsoft-edge';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.type).toBe(BrowserType.Edge);
    });
  });

  describe('自定义浏览器路径', () => {
    beforeEach(() => {
      vi.mocked(platform).mockReturnValue('win32');
    });

    it('应该优先使用 NND_BROWSER_PATH 环境变量', () => {
      const customPath = 'C:\\Custom\\chrome.exe';
      process.env.NND_BROWSER_PATH = customPath;

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === customPath;
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.path).toBe(customPath);
    });

    it('应该从路径推断 Chrome 类型', () => {
      process.env.NND_BROWSER_PATH = 'C:\\Custom\\chrome.exe';
      vi.mocked(existsSync).mockReturnValue(true);

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result?.type).toBe(BrowserType.Chrome);
    });

    it('应该从路径推断 Edge 类型', () => {
      process.env.NND_BROWSER_PATH = 'C:\\Custom\\msedge.exe';
      vi.mocked(existsSync).mockReturnValue(true);

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result?.type).toBe(BrowserType.Edge);
    });

    it('应该从路径推断 Chromium 类型', () => {
      process.env.NND_BROWSER_PATH = 'C:\\Custom\\chromium.exe';
      vi.mocked(existsSync).mockReturnValue(true);

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result?.type).toBe(BrowserType.Chromium);
    });

    it('当自定义路径不存在时应该回退到自动检测', () => {
      process.env.NND_BROWSER_PATH = 'C:\\NonExistent\\chrome.exe';

      vi.mocked(existsSync).mockImplementation((path) => {
        // 自定义路径不存在，但标准 Chrome 路径存在
        return path === 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      });

      const detector = createBrowserDetector();
      const result = detector.detect();

      expect(result).not.toBeNull();
      expect(result?.path).toBe('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    });
  });

  describe('detectAll()', () => {
    beforeEach(() => {
      vi.mocked(platform).mockReturnValue('win32');
      process.env.LOCALAPPDATA = 'C:\\Users\\Test\\AppData\\Local';
    });

    it('应该返回所有已安装的浏览器', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path);
        // Chrome、Edge 和 Chromium 都存在
        return (
          pathStr.includes('Chrome\\Application\\chrome.exe') ||
          pathStr.includes('Edge\\Application\\msedge.exe') ||
          pathStr.includes('Chromium\\Application\\chrome.exe')
        );
      });

      const detector = createBrowserDetector();
      const results = detector.detectAll();

      expect(results.length).toBeGreaterThan(0);
      // 应该按优先级排序
      if (results.length > 1) {
        expect(results[0].type).toBe(BrowserType.Chrome);
      }
    });

    it('应该包含自定义路径的浏览器', () => {
      const customPath = 'C:\\Custom\\chrome.exe';
      process.env.NND_BROWSER_PATH = customPath;

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === customPath || path === 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      });

      const detector = createBrowserDetector();
      const results = detector.detectAll();

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(b => b.path === customPath)).toBe(true);
    });

    it('应该避免重复添加相同路径的浏览器', () => {
      const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      process.env.NND_BROWSER_PATH = chromePath;

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === chromePath;
      });

      const detector = createBrowserDetector();
      const results = detector.detectAll();

      // 应该只有一个 Chrome
      const chromeCount = results.filter(b => b.path === chromePath).length;
      expect(chromeCount).toBe(1);
    });

    it('当没有浏览器时应该返回空数组', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const detector = createBrowserDetector();
      const results = detector.detectAll();

      expect(results).toEqual([]);
    });
  });

  describe('单例模式', () => {
    it('getBrowserDetector() 应该返回相同的实例', () => {
      const detector1 = getBrowserDetector();
      const detector2 = getBrowserDetector();

      expect(detector1).toBe(detector2);
    });

    it('createBrowserDetector() 应该返回新的实例', () => {
      const detector1 = createBrowserDetector();
      const detector2 = createBrowserDetector();

      expect(detector1).not.toBe(detector2);
    });
  });
});
