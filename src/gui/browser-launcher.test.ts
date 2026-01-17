/**
 * 浏览器启动器单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createBrowserLauncher,
  resetBrowserLauncher,
  buildGUIUrl,
  type IBrowserLauncher,
} from './browser-launcher.js';
import { resetConfig } from '../config.js';

// 模拟 open 包
vi.mock('open', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

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
    vi.clearAllMocks();
  });

  describe('生命周期', () => {
    it('初始状态应该是未打开', () => {
      expect(launcher.isOpen()).toBe(false);
    });

    it('打开后状态应该是已打开', async () => {
      await launcher.open('http://localhost:9230');
      expect(launcher.isOpen()).toBe(true);
    });

    it('关闭后状态应该是未打开', async () => {
      await launcher.open('http://localhost:9230');
      await launcher.close();
      expect(launcher.isOpen()).toBe(false);
    });

    it('重复关闭应该是安全的', async () => {
      await launcher.open('http://localhost:9230');
      await launcher.close();
      await launcher.close(); // 不应该抛出错误
      expect(launcher.isOpen()).toBe(false);
    });
  });

  describe('默认浏览器', () => {
    it('应该调用 open 包打开 URL', async () => {
      const openModule = await import('open');
      const openMock = openModule.default as ReturnType<typeof vi.fn>;

      await launcher.open('http://localhost:9230?wsPort=9231');

      expect(openMock).toHaveBeenCalledWith('http://localhost:9230?wsPort=9231');
    });
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
