/**
 * 浏览器检测器单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BrowserType,
  type BrowserInfo,
  getBrowserDetector,
  createBrowserDetector,
} from './browser-detector.js';

describe('BrowserDetector', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 保存原始环境变量
    originalEnv = { ...process.env };
    // 清除自定义浏览器路径
    delete process.env.NND_BROWSER_PATH;
  });

  afterEach(() => {
    // 恢复环境变量
    process.env = originalEnv;
  });

  describe('detect() 方法', () => {
    it('应该检测到系统已安装的浏览器', () => {
      const detector = createBrowserDetector();
      const result = detector.detect();

      // 在实际系统上应该能检测到至少一个浏览器（或返回 null）
      if (result) {
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('name');
        expect(Object.values(BrowserType)).toContain(result.type);
      }
    });

    it('应该优先使用 NND_BROWSER_PATH 环境变量（如果存在且有效）', () => {
      // 使用实际存在的浏览器路径
      const detector = createBrowserDetector();
      const realBrowser = detector.detect();
      
      if (realBrowser) {
        // 设置自定义路径为实际存在的浏览器
        process.env.NND_BROWSER_PATH = realBrowser.path;
        
        const customDetector = createBrowserDetector();
        const result = customDetector.detect();
        
        expect(result).not.toBeNull();
        expect(result?.path).toBe(realBrowser.path);
      }
    });

    it('应该从路径推断 Chrome 类型', () => {
      // 创建一个包含 chrome 的临时路径
      const chromePath = process.platform === 'win32' 
        ? 'C:\\Custom\\chrome.exe'
        : '/custom/chrome';
      
      // 只有当路径实际存在时才测试
      // 这个测试主要验证类型推断逻辑
      const detector = createBrowserDetector();
      const result = detector.detect();
      
      // 如果检测到 Chrome，验证类型正确
      if (result && result.path.toLowerCase().includes('chrome') && !result.path.toLowerCase().includes('chromium')) {
        expect(result.type).toBe(BrowserType.Chrome);
      }
    });

    it('应该从路径推断 Edge 类型', () => {
      const detector = createBrowserDetector();
      const result = detector.detect();
      
      // 如果检测到 Edge，验证类型正确
      if (result && (result.path.toLowerCase().includes('edge') || result.path.toLowerCase().includes('msedge'))) {
        expect(result.type).toBe(BrowserType.Edge);
      }
    });

    it('应该从路径推断 Chromium 类型', () => {
      const detector = createBrowserDetector();
      const result = detector.detect();
      
      // 如果检测到 Chromium，验证类型正确
      if (result && result.path.toLowerCase().includes('chromium')) {
        expect(result.type).toBe(BrowserType.Chromium);
      }
    });
  });

  describe('detectAll() 方法', () => {
    it('应该返回所有已安装的浏览器', () => {
      const detector = createBrowserDetector();
      const results = detector.detectAll();

      // 应该返回数组
      expect(Array.isArray(results)).toBe(true);
      
      // 每个结果都应该有正确的结构
      results.forEach(browser => {
        expect(browser).toHaveProperty('type');
        expect(browser).toHaveProperty('path');
        expect(browser).toHaveProperty('name');
        expect(Object.values(BrowserType)).toContain(browser.type);
      });
    });

    it('应该按优先级排序（Chrome > Edge > Chromium）', () => {
      const detector = createBrowserDetector();
      const results = detector.detectAll();

      if (results.length > 1) {
        // 验证排序：Chrome 应该在 Edge 之前，Edge 应该在 Chromium 之前
        const chromeIndex = results.findIndex(b => b.type === BrowserType.Chrome);
        const edgeIndex = results.findIndex(b => b.type === BrowserType.Edge);
        const chromiumIndex = results.findIndex(b => b.type === BrowserType.Chromium);

        if (chromeIndex !== -1 && edgeIndex !== -1) {
          expect(chromeIndex).toBeLessThan(edgeIndex);
        }
        if (edgeIndex !== -1 && chromiumIndex !== -1) {
          expect(edgeIndex).toBeLessThan(chromiumIndex);
        }
        if (chromeIndex !== -1 && chromiumIndex !== -1) {
          expect(chromeIndex).toBeLessThan(chromiumIndex);
        }
      }
    });

    it('应该包含自定义路径的浏览器（如果设置）', () => {
      const detector = createBrowserDetector();
      const realBrowser = detector.detect();
      
      if (realBrowser) {
        process.env.NND_BROWSER_PATH = realBrowser.path;
        
        const customDetector = createBrowserDetector();
        const results = customDetector.detectAll();
        
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results.some(b => b.path === realBrowser.path)).toBe(true);
      }
    });

    it('应该避免重复添加相同路径的浏览器', () => {
      const detector = createBrowserDetector();
      const realBrowser = detector.detect();
      
      if (realBrowser) {
        // 设置自定义路径为已存在的浏览器路径
        process.env.NND_BROWSER_PATH = realBrowser.path;
        
        const customDetector = createBrowserDetector();
        const results = customDetector.detectAll();
        
        // 统计相同路径的浏览器数量
        const samePathCount = results.filter(b => b.path === realBrowser.path).length;
        expect(samePathCount).toBe(1);
      }
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

  describe('浏览器类型推断', () => {
    it('应该正确识别 Chrome 浏览器', () => {
      const detector = createBrowserDetector();
      const allBrowsers = detector.detectAll();
      
      const chromeBrowsers = allBrowsers.filter(b => b.type === BrowserType.Chrome);
      chromeBrowsers.forEach(browser => {
        const lowerPath = browser.path.toLowerCase();
        expect(
          lowerPath.includes('chrome') && !lowerPath.includes('chromium')
        ).toBe(true);
      });
    });

    it('应该正确识别 Edge 浏览器', () => {
      const detector = createBrowserDetector();
      const allBrowsers = detector.detectAll();
      
      const edgeBrowsers = allBrowsers.filter(b => b.type === BrowserType.Edge);
      edgeBrowsers.forEach(browser => {
        const lowerPath = browser.path.toLowerCase();
        expect(
          lowerPath.includes('edge') || lowerPath.includes('msedge')
        ).toBe(true);
      });
    });

    it('应该正确识别 Chromium 浏览器', () => {
      const detector = createBrowserDetector();
      const allBrowsers = detector.detectAll();
      
      const chromiumBrowsers = allBrowsers.filter(b => b.type === BrowserType.Chromium);
      chromiumBrowsers.forEach(browser => {
        expect(browser.path.toLowerCase().includes('chromium')).toBe(true);
      });
    });
  });

  describe('浏览器名称', () => {
    it('Chrome 应该有正确的显示名称', () => {
      const detector = createBrowserDetector();
      const allBrowsers = detector.detectAll();
      
      const chromeBrowsers = allBrowsers.filter(b => b.type === BrowserType.Chrome);
      chromeBrowsers.forEach(browser => {
        expect(browser.name).toContain('Chrome');
      });
    });

    it('Edge 应该有正确的显示名称', () => {
      const detector = createBrowserDetector();
      const allBrowsers = detector.detectAll();
      
      const edgeBrowsers = allBrowsers.filter(b => b.type === BrowserType.Edge);
      edgeBrowsers.forEach(browser => {
        expect(browser.name).toContain('Edge');
      });
    });

    it('Chromium 应该有正确的显示名称', () => {
      const detector = createBrowserDetector();
      const allBrowsers = detector.detectAll();
      
      const chromiumBrowsers = allBrowsers.filter(b => b.type === BrowserType.Chromium);
      chromiumBrowsers.forEach(browser => {
        expect(browser.name).toContain('Chromium');
      });
    });
  });
});
