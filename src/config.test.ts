/**
 * 配置模块测试
 * 
 * **Property 16: 环境变量配置生效**
 * **Validates: Requirements 6.6**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { getConfig, setConfig, resetConfig, getDefaultConfig } from './config.js';

describe('Config Module', () => {
  // 保存原始环境变量
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // 清理环境变量
    delete process.env.NND_MAX_REQUESTS;
    delete process.env.NND_MAX_BODY_SIZE;
    delete process.env.NND_INTERCEPT_HTTP;
    delete process.env.NND_INTERCEPT_UNDICI;
    delete process.env.NND_REDACT_HEADERS;
    delete process.env.NND_DISABLE_BODY_CAPTURE;
    // GUI 相关环境变量
    delete process.env.NND_GUI_ENABLED;
    delete process.env.NND_GUI_PORT;
    delete process.env.NND_WS_PORT;
    delete process.env.NND_AUTO_OPEN;
    // 浏览器窗口配置环境变量
    delete process.env.NND_BROWSER_WIDTH;
    delete process.env.NND_BROWSER_HEIGHT;
    delete process.env.NND_BROWSER_TITLE;
    delete process.env.NND_BROWSER_PATH;
    resetConfig();
  });

  afterEach(() => {
    // 恢复原始环境变量
    process.env = { ...originalEnv };
    resetConfig();
  });

  describe('getDefaultConfig', () => {
    it('should return default values', () => {
      const config = getDefaultConfig();
      expect(config.maxRequests).toBe(1000);
      expect(config.maxBodySize).toBe(1024 * 1024);
      expect(config.interceptHttp).toBe(true);
      expect(config.interceptUndici).toBe(true);
      expect(config.redactHeaders).toEqual(['authorization', 'cookie']);
      expect(config.disableBodyCapture).toBe(false);
      // GUI 配置默认值
      expect(config.guiEnabled).toBe(true);
      expect(config.guiPort).toBe('auto');
      expect(config.wsPort).toBe('auto');
      expect(config.autoOpen).toBe(true);
      // 浏览器窗口配置默认值
      expect(config.browserWindowSize).toEqual({ width: 800, height: 600 });
      expect(config.browserWindowTitle).toBe('Node Network DevTools');
    });
  });

  describe('setConfig', () => {
    it('should merge partial config', () => {
      setConfig({ maxRequests: 500 });
      const config = getConfig();
      expect(config.maxRequests).toBe(500);
      expect(config.maxBodySize).toBe(1024 * 1024); // 保持默认值
    });

    it('should allow multiple setConfig calls', () => {
      setConfig({ maxRequests: 500 });
      setConfig({ maxBodySize: 2048 });
      const config = getConfig();
      expect(config.maxRequests).toBe(500);
      expect(config.maxBodySize).toBe(2048);
    });
  });

  describe('resetConfig', () => {
    it('should reset to default values', () => {
      setConfig({ maxRequests: 500, maxBodySize: 2048 });
      resetConfig();
      const config = getConfig();
      expect(config.maxRequests).toBe(1000);
      expect(config.maxBodySize).toBe(1024 * 1024);
    });
  });

  /**
   * Property 16: 环境变量配置生效
   * 
   * *For any* 通过环境变量设置的配置值，工具运行时应该使用该配置值而非默认值。
   */
  describe('Property 16: 环境变量配置生效', () => {
    it('should use NND_MAX_REQUESTS from environment', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          (maxRequests) => {
            process.env.NND_MAX_REQUESTS = String(maxRequests);
            resetConfig();
            const config = getConfig();
            return config.maxRequests === maxRequests;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use NND_MAX_BODY_SIZE from environment', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          (maxBodySize) => {
            process.env.NND_MAX_BODY_SIZE = String(maxBodySize);
            resetConfig();
            const config = getConfig();
            return config.maxBodySize === maxBodySize;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use NND_INTERCEPT_HTTP from environment', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (interceptHttp) => {
            process.env.NND_INTERCEPT_HTTP = String(interceptHttp);
            resetConfig();
            const config = getConfig();
            return config.interceptHttp === interceptHttp;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use NND_INTERCEPT_UNDICI from environment', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (interceptUndici) => {
            process.env.NND_INTERCEPT_UNDICI = String(interceptUndici);
            resetConfig();
            const config = getConfig();
            return config.interceptUndici === interceptUndici;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use NND_DISABLE_BODY_CAPTURE from environment', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (disableBodyCapture) => {
            process.env.NND_DISABLE_BODY_CAPTURE = String(disableBodyCapture);
            resetConfig();
            const config = getConfig();
            return config.disableBodyCapture === disableBodyCapture;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use NND_REDACT_HEADERS from environment', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-z][a-z0-9-]*$/), { minLength: 1, maxLength: 5 }),
          (headers) => {
            process.env.NND_REDACT_HEADERS = headers.join(',');
            resetConfig();
            const config = getConfig();
            // 环境变量解析会转为小写
            const expected = headers.map(h => h.toLowerCase());
            return JSON.stringify(config.redactHeaders) === JSON.stringify(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various boolean string formats', () => {
      const trueValues = ['true', 'TRUE', 'True', '1', 'yes', 'YES'];
      const falseValues = ['false', 'FALSE', 'False', '0', 'no', 'NO'];

      for (const val of trueValues) {
        process.env.NND_INTERCEPT_HTTP = val;
        resetConfig();
        expect(getConfig().interceptHttp).toBe(true);
      }

      for (const val of falseValues) {
        process.env.NND_INTERCEPT_HTTP = val;
        resetConfig();
        expect(getConfig().interceptHttp).toBe(false);
      }
    });

    it('should use default value for invalid number', () => {
      process.env.NND_MAX_REQUESTS = 'invalid';
      resetConfig();
      const config = getConfig();
      expect(config.maxRequests).toBe(1000); // 默认值
    });

    it('should use default value for empty string', () => {
      process.env.NND_REDACT_HEADERS = '';
      resetConfig();
      const config = getConfig();
      expect(config.redactHeaders).toEqual(['authorization', 'cookie']); // 默认值
    });
  });

  describe('GUI Configuration', () => {
    it('should use NND_GUI_ENABLED from environment', () => {
      process.env.NND_GUI_ENABLED = 'false';
      resetConfig();
      expect(getConfig().guiEnabled).toBe(false);

      process.env.NND_GUI_ENABLED = 'true';
      resetConfig();
      expect(getConfig().guiEnabled).toBe(true);
    });

    it('should use NND_GUI_PORT from environment', () => {
      process.env.NND_GUI_PORT = '9230';
      resetConfig();
      expect(getConfig().guiPort).toBe(9230);

      process.env.NND_GUI_PORT = 'auto';
      resetConfig();
      expect(getConfig().guiPort).toBe('auto');
    });

    it('should use NND_WS_PORT from environment', () => {
      process.env.NND_WS_PORT = '9231';
      resetConfig();
      expect(getConfig().wsPort).toBe(9231);

      process.env.NND_WS_PORT = 'auto';
      resetConfig();
      expect(getConfig().wsPort).toBe('auto');
    });

    it('should use NND_AUTO_OPEN from environment', () => {
      process.env.NND_AUTO_OPEN = 'false';
      resetConfig();
      expect(getConfig().autoOpen).toBe(false);
    });
  });

  describe('Browser Window Configuration', () => {
    it('should use NND_BROWSER_WIDTH from environment', () => {
      process.env.NND_BROWSER_WIDTH = '1920';
      resetConfig();
      expect(getConfig().browserWindowSize?.width).toBe(1920);
    });

    it('should use NND_BROWSER_HEIGHT from environment', () => {
      process.env.NND_BROWSER_HEIGHT = '1080';
      resetConfig();
      expect(getConfig().browserWindowSize?.height).toBe(1080);
    });

    it('should use NND_BROWSER_TITLE from environment', () => {
      process.env.NND_BROWSER_TITLE = 'My DevTools';
      resetConfig();
      expect(getConfig().browserWindowTitle).toBe('My DevTools');
    });

    it('should use NND_BROWSER_PATH from environment', () => {
      process.env.NND_BROWSER_PATH = '/custom/path/to/browser';
      resetConfig();
      expect(getConfig().browserPath).toBe('/custom/path/to/browser');
    });

    it('should have undefined browserPath by default', () => {
      resetConfig();
      expect(getConfig().browserPath).toBeUndefined();
    });
  });
});
