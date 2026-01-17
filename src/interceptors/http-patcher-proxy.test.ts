/**
 * HTTP 拦截器 - axios 代理兼容性测试
 */

import { describe, it, expect } from 'vitest';

describe('http-patcher axios 代理兼容性', () => {
  // URL 重复检测的正则表达式（与 http-patcher.ts 中相同）
  const duplicateUrlPattern = /^(https?:\/\/[^\/]+)(https?:\/\/.+)$/;

  describe('检测 axios 代理 URL 模式', () => {
    it('应该检测 HTTP 代理 + HTTP 目标', () => {
      const url = 'http://127.0.0.1:7897http://api.example.com/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('http://127.0.0.1:7897');
      expect(match![2]).toBe('http://api.example.com/path');
    });

    it('应该检测 HTTP 代理 + HTTPS 目标', () => {
      const url = 'http://127.0.0.1:7897https://api.example.com/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('http://127.0.0.1:7897');
      expect(match![2]).toBe('https://api.example.com/path');
    });

    it('应该检测 HTTPS 代理 + HTTP 目标', () => {
      const url = 'https://proxy.local:8080http://api.example.com/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('https://proxy.local:8080');
      expect(match![2]).toBe('http://api.example.com/path');
    });

    it('应该检测 HTTPS 代理 + HTTPS 目标', () => {
      const url = 'https://proxy.local:8080https://api.example.com/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('https://proxy.local:8080');
      expect(match![2]).toBe('https://api.example.com/path');
    });

    it('应该检测真实的 URL 重复案例', () => {
      const url = 'http://127.0.0.1:7897http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('http://127.0.0.1:7897');
      expect(match![2]).toBe('http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion');
    });
  });

  describe('不应该误判正常 URL', () => {
    it('不应该匹配正常的 HTTP URL', () => {
      const url = 'http://example.com/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeFalsy();
    });

    it('不应该匹配正常的 HTTPS URL', () => {
      const url = 'https://example.com/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeFalsy();
    });

    it('不应该匹配包含 http 的路径', () => {
      const url = 'http://example.com/http/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeFalsy();
    });

    it('不应该匹配包含 https 的路径', () => {
      const url = 'https://example.com/https/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeFalsy();
    });

    it('不应该匹配查询参数中的 URL', () => {
      const url = 'http://example.com/redirect?url=http://target.com';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeFalsy();
    });

    it('不应该匹配带端口的正常 URL', () => {
      const url = 'http://example.com:8080/path';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeFalsy();
    });
  });

  describe('边界情况', () => {
    it('应该处理没有路径的代理 URL', () => {
      const url = 'http://127.0.0.1:7897http://api.example.com';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('http://127.0.0.1:7897');
      expect(match![2]).toBe('http://api.example.com');
    });

    it('应该处理带查询参数的目标 URL', () => {
      const url = 'http://127.0.0.1:7897http://api.example.com/path?key=value';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('http://127.0.0.1:7897');
      expect(match![2]).toBe('http://api.example.com/path?key=value');
    });

    it('应该处理带锚点的目标 URL', () => {
      const url = 'http://127.0.0.1:7897http://api.example.com/path#section';
      const match = url.match(duplicateUrlPattern);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('http://127.0.0.1:7897');
      expect(match![2]).toBe('http://api.example.com/path#section');
    });
  });

  describe('URL 提取', () => {
    it('应该正确提取代理地址和目标 URL', () => {
      const testCases = [
        {
          input: 'http://127.0.0.1:7897http://api.example.com/path',
          proxy: 'http://127.0.0.1:7897',
          target: 'http://api.example.com/path',
        },
        {
          input: 'https://proxy.local:8080https://secure.api.com/data',
          proxy: 'https://proxy.local:8080',
          target: 'https://secure.api.com/data',
        },
        {
          input: 'http://10.0.0.1:3128http://internal.service/api',
          proxy: 'http://10.0.0.1:3128',
          target: 'http://internal.service/api',
        },
      ];

      testCases.forEach(({ input, proxy, target }) => {
        const match = input.match(duplicateUrlPattern);
        expect(match).toBeTruthy();
        expect(match![1]).toBe(proxy);
        expect(match![2]).toBe(target);
      });
    });
  });
});
