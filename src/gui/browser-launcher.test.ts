/**
 * 浏览器启动器单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBrowserLauncher,
  resetBrowserLauncher,
  buildGUIUrl,
  buildLaunchArgs,
  type IBrowserLauncher,
  PuppeteerNotInstalledError,
} from './browser-launcher.js';
import { resetConfig, setConfig } from '../config.js';

describe('BrowserLauncher', () => {
  let launcher: IBrowserLauncher;

  beforeEach(() => {
    resetConfig();
    launcher = createBrowserLauncher();
  });

  afterEach(async () => {
    await launcher.close();
    await resetBrowserLauncher();
    resetConfig();
  });

  describe('生命周期', () => {
    it('初始状态应该是未打开', () => {
      expect(launcher.isOpen()).toBe(false);
    });

    it('关闭后状态应该是未打开', async () => {
      await launcher.close();
      expect(launcher.isOpen()).toBe(false);
    });

    it('重复关闭应该是安全的', async () => {
      await launcher.close();
      await launcher.close(); // 不应该抛出错误
      expect(launcher.isOpen()).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('应该定义 PuppeteerNotInstalledError', () => {
      const error = new PuppeteerNotInstalledError('测试错误');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PuppeteerNotInstalledError');
      expect(error.message).toBe('测试错误');
    });

    it('PuppeteerNotInstalledError 应该有默认消息', () => {
      const error = new PuppeteerNotInstalledError();
      expect(error.message).toBe('Puppeteer 未安装');
    });
  });
});

describe('buildLaunchArgs', () => {
  it('应该生成正确的启动参数', () => {
    const url = 'http://localhost:9230';
    const config = { width: 800, height: 600, title: 'Test' };
    const args = buildLaunchArgs(url, config);

    expect(args).toContain('--app=http://localhost:9230');
    expect(args).toContain('--window-size=800,600');
    expect(args).toContain('--no-sandbox');
    expect(args).toContain('--disable-setuid-sandbox');
  });

  it('应该支持自定义窗口大小', () => {
    const url = 'http://localhost:9230';
    const config = { width: 1024, height: 768, title: 'Test' };
    const args = buildLaunchArgs(url, config);

    expect(args).toContain('--window-size=1024,768');
  });

  it('应该包含所有必需的优化参数', () => {
    const url = 'http://localhost:9230';
    const config = { width: 800, height: 600, title: 'Test' };
    const args = buildLaunchArgs(url, config);

    // 检查关键优化参数
    expect(args).toContain('--disable-extensions');
    expect(args).toContain('--disable-background-networking');
    expect(args).toContain('--mute-audio');
    expect(args).toContain('--no-first-run');
  });
});

describe('buildGUIUrl', () => {
  it('应该构建正确格式的 URL', () => {
    const url = buildGUIUrl('127.0.0.1', 9230, 9231);
    expect(url).toBe('http://127.0.0.1:9230?wsPort=9231');
  });

  it('应该支持 localhost', () => {
    const url = buildGUIUrl('localhost', 8080, 8081);
    expect(url).toBe('http://localhost:8080?wsPort=8081');
  });

  it('应该支持自定义端口', () => {
    const url = buildGUIUrl('127.0.0.1', 3000, 3001);
    expect(url).toBe('http://127.0.0.1:3000?wsPort=3001');
  });
});
