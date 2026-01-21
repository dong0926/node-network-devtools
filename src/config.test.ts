/**
 * 配置模块测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

  describe('环境变量配置生效', () => {
    it('应该使用环境变量中的 NND_MAX_REQUESTS', () => {
      process.env.NND_MAX_REQUESTS = '2000';
      resetConfig();
      expect(getConfig().maxRequests).toBe(2000);
    });

    it('应该使用环境变量中的 NND_MAX_BODY_SIZE', () => {
      process.env.NND_MAX_BODY_SIZE = '5000';
      resetConfig();
      expect(getConfig().maxBodySize).toBe(5000);
    });

    it('应该使用环境变量中的 NND_INTERCEPT_HTTP', () => {
      process.env.NND_INTERCEPT_HTTP = 'false';
      resetConfig();
      expect(getConfig().interceptHttp).toBe(false);
    });

    it('应该使用环境变量中的 NND_REDACT_HEADERS', () => {
      process.env.NND_REDACT_HEADERS = 'x-token,x-api-key';
      resetConfig();
      expect(getConfig().redactHeaders).toEqual(['x-token', 'x-api-key']);
    });

    it('应能处理各种布尔字符串格式', () => {
      const trueValues = ['true', 'TRUE', '1', 'yes'];
      const falseValues = ['false', 'FALSE', '0', 'no'];

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

    it('无效数字应使用默认值', () => {
      process.env.NND_MAX_REQUESTS = 'invalid';
      resetConfig();
      expect(getConfig().maxRequests).toBe(1000);
    });
  });

  describe('GUI 配置', () => {
    it('应该使用环境变量中的 GUI 设置', () => {
      process.env.NND_GUI_ENABLED = 'false';
      process.env.NND_GUI_PORT = '9230';
      process.env.NND_AUTO_OPEN = 'false';
      resetConfig();
      
      const config = getConfig();
      expect(config.guiEnabled).toBe(false);
      expect(config.guiPort).toBe(9230);
      expect(config.autoOpen).toBe(false);
    });
  });

  describe('浏览器窗口配置', () => {
    it('应该使用环境变量中的窗口设置', () => {
      process.env.NND_BROWSER_WIDTH = '1920';
      process.env.NND_BROWSER_HEIGHT = '1080';
      process.env.NND_BROWSER_TITLE = 'My DevTools';
      resetConfig();
      
      const config = getConfig();
      expect(config.browserWindowSize?.width).toBe(1920);
      expect(config.browserWindowSize?.height).toBe(1080);
      expect(config.browserWindowTitle).toBe('My DevTools');
    });
  });
});