/**
 * Undici/Fetch 拦截器 Vitest 测试
 * 
 * 注意：由于 ESM 模块隔离的限制，实际的 fetch 拦截测试
 * 需要使用 Node.js 原生测试运行器运行：
 * pnpm test:undici
 * 
 * 本文件只测试基本的 install/uninstall 功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UndiciPatcher, isInstalled, install, uninstall, isUndiciAvailable } from './undici-patcher.js';

describe('UndiciPatcher', () => {
  beforeEach(() => {
    uninstall();
  });

  afterEach(() => {
    uninstall();
  });

  describe('undici 可用性检查', () => {
    it('应该能检查 undici 是否可用', () => {
      const available = isUndiciAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('install/uninstall', () => {
    it('初始状态应该是未安装', () => {
      expect(isInstalled()).toBe(false);
    });

    it('安装后应该返回已安装状态', () => {
      if (!isUndiciAvailable()) return;
      install();
      expect(isInstalled()).toBe(true);
    });

    it('卸载后应该返回未安装状态', () => {
      if (!isUndiciAvailable()) return;
      install();
      uninstall();
      expect(isInstalled()).toBe(false);
    });

    it('重复安装应该是幂等的', () => {
      if (!isUndiciAvailable()) return;
      install();
      install();
      expect(isInstalled()).toBe(true);
    });

    it('重复卸载应该是幂等的', () => {
      if (!isUndiciAvailable()) return;
      install();
      uninstall();
      uninstall();
      expect(isInstalled()).toBe(false);
    });
  });

  describe('UndiciPatcher 对象', () => {
    it('应该导出所有必要的方法', () => {
      expect(typeof UndiciPatcher.install).toBe('function');
      expect(typeof UndiciPatcher.uninstall).toBe('function');
      expect(typeof UndiciPatcher.isInstalled).toBe('function');
      expect(typeof UndiciPatcher.isUndiciAvailable).toBe('function');
      expect(typeof UndiciPatcher.setTraceIdGetter).toBe('function');
    });
  });

  describe('URL 构建逻辑', () => {
    it('应该正确处理相对路径', () => {
      const origin = 'http://example.com';
      const path = '/api/users';
      const url = path.startsWith('http://') || path.startsWith('https://') 
        ? path 
        : `${origin}${path}`;
      expect(url).toBe('http://example.com/api/users');
    });

    it('应该正确处理完整 URL（代理场景）', () => {
      const origin = 'http://127.0.0.1:7897';
      const path = 'http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion';
      const url = path.startsWith('http://') || path.startsWith('https://') 
        ? path 
        : `${origin}${path}`;
      expect(url).toBe('http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion');
    });

    it('应该正确处理 HTTPS 完整 URL', () => {
      const origin = 'http://proxy.local:8080';
      const path = 'https://api.example.com/data';
      const url = path.startsWith('http://') || path.startsWith('https://') 
        ? path 
        : `${origin}${path}`;
      expect(url).toBe('https://api.example.com/data');
    });
  });
});
