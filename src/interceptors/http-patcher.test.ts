/**
 * HTTP 拦截器 Vitest 测试
 * 
 * 注意：由于 ESM 模块隔离的限制，实际的 HTTP 拦截测试
 * 需要使用 Node.js 原生测试运行器运行：
 * pnpm test:http
 * 
 * 本文件只测试基本的 install/uninstall 功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HttpPatcher, isInstalled, install, uninstall } from './http-patcher.js';

describe('HttpPatcher', () => {
  beforeEach(() => {
    uninstall();
  });

  afterEach(() => {
    uninstall();
  });

  describe('install/uninstall', () => {
    it('初始状态应该是未安装', () => {
      expect(isInstalled()).toBe(false);
    });

    it('安装后应该返回已安装状态', () => {
      install();
      expect(isInstalled()).toBe(true);
    });

    it('卸载后应该返回未安装状态', () => {
      install();
      uninstall();
      expect(isInstalled()).toBe(false);
    });

    it('重复安装应该是幂等的', () => {
      install();
      install();
      expect(isInstalled()).toBe(true);
    });

    it('重复卸载应该是幂等的', () => {
      install();
      uninstall();
      uninstall();
      expect(isInstalled()).toBe(false);
    });
  });

  describe('HttpPatcher 对象', () => {
    it('应该导出所有必要的方法', () => {
      expect(typeof HttpPatcher.install).toBe('function');
      expect(typeof HttpPatcher.uninstall).toBe('function');
      expect(typeof HttpPatcher.isInstalled).toBe('function');
      expect(typeof HttpPatcher.setTraceIdGetter).toBe('function');
      // getHttpModule 和 getHttpsModule 在 ESM 环境下可能不可用
      // 这些方法主要用于测试目的
    });
  });
});
