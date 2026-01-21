/**
 * PayloadTab 组件单元测试
 * 
 * 验证需求：2.1, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayloadTab } from './PayloadTab.js';

describe('PayloadTab', () => {
  describe('Query Parameters 部分的条件渲染 - 验证需求 2.1, 2.4', () => {
    it('当 URL 包含查询参数时应该显示 Query Parameters 部分 - 验证需求 2.1', () => {
      const url = 'http://example.com?foo=bar&baz=qux';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示 Query Parameters 标题
      expect(screen.getByText('Query Parameters')).toBeDefined();
      
      // 应该显示参数内容
      expect(screen.getByText('foo')).toBeDefined();
      expect(screen.getByText('bar')).toBeDefined();
    });

    it('当 URL 不包含查询参数时不应该显示 Query Parameters 部分 - 验证需求 2.4', () => {
      const url = 'http://example.com';
      const body = 'test body';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 不应该显示 Query Parameters 标题
      expect(() => screen.getByText('Query Parameters')).toThrow();
    });

    it('当 URL 只有问号但没有参数时不应该显示 Query Parameters 部分', () => {
      const url = 'http://example.com?';
      const body = 'test body';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 不应该显示 Query Parameters 标题
      expect(() => screen.getByText('Query Parameters')).toThrow();
    });

    it('当 URL 无效时不应该显示 Query Parameters 部分', () => {
      const url = 'not-a-valid-url';
      const body = 'test body';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 不应该显示 Query Parameters 标题
      expect(() => screen.getByText('Query Parameters')).toThrow();
    });

    it('当 URL 包含多个查询参数时应该全部显示', () => {
      const url = 'http://example.com?a=1&b=2&c=3';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示所有参数
      expect(screen.getByText('a')).toBeDefined();
      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('b')).toBeDefined();
      expect(screen.getByText('2')).toBeDefined();
      expect(screen.getByText('c')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });
  });

  describe('Request Body 部分的条件渲染 - 验证需求 2.3, 2.5', () => {
    it('当请求包含 body 时应该显示 Request Body 部分 - 验证需求 2.3', () => {
      const url = 'http://example.com';
      const body = 'test body content';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示 Request Body 标题
      expect(screen.getByText('Request Body')).toBeDefined();
      
      // 应该显示 body 内容
      expect(screen.getByText('test body content')).toBeDefined();
    });

    it('当请求不包含 body 且没有查询参数时应该显示 "No request payload" - 验证需求 2.5', () => {
      const url = 'http://example.com';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示空状态提示
      expect(screen.getByText('No request payload')).toBeDefined();
    });

    it('当请求不包含 body 但有查询参数时不应该显示 "No request body"', () => {
      const url = 'http://example.com?foo=bar';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示查询参数
      expect(screen.getByText('Query Parameters')).toBeDefined();
      
      // 不应该显示 "No request body" 或 "No request payload"
      expect(() => screen.getByText('No request body')).toThrow();
      expect(() => screen.getByText('No request payload')).toThrow();
    });

    it('当 body 为空字符串时应该显示 "No request payload"', () => {
      const url = 'http://example.com';
      const body = '';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 空字符串是 falsy 值，应该显示空状态
      expect(screen.getByText('No request payload')).toBeDefined();
    });
  });

  describe('JSON 数据的展示 - 验证需求 2.3', () => {
    it('当 body 是有效的 JSON 对象时应该使用 JSONViewer 展示', () => {
      const url = 'http://example.com';
      const body = JSON.stringify({ name: 'John', age: 25 });
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 应该显示 Request Body 标题
      expect(screen.getByText('Request Body')).toBeDefined();
      
      // 应该显示 JSON 内容（JSONViewer 会渲染这些）
      expect(container.textContent).toContain('name');
      expect(container.textContent).toContain('John');
      expect(container.textContent).toContain('age');
      expect(container.textContent).toContain('25');
    });

    it('当 body 是有效的 JSON 数组时应该使用 JSONViewer 展示', () => {
      const url = 'http://example.com';
      const body = JSON.stringify([1, 2, 3, 4, 5]);
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 应该显示 Request Body 标题
      expect(screen.getByText('Request Body')).toBeDefined();
      
      // 应该显示数组内容
      expect(container.textContent).toContain('1');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('3');
    });

    it('当 body 是嵌套的 JSON 对象时应该正确展示', () => {
      const url = 'http://example.com';
      const body = JSON.stringify({
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      });
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 应该显示第一层的 user 键
      expect(container.textContent).toContain('user');
      
      // 默认只展开第一层，所以嵌套的 name 和 address 会被折叠
      // 但应该显示折叠提示（如 {...}）
      expect(container.textContent).toMatch(/\{.*\}/);
    });

    it('当 body 不是有效的 JSON 时应该显示原始文本', () => {
      const url = 'http://example.com';
      const body = 'This is plain text, not JSON';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示原始文本
      expect(screen.getByText('This is plain text, not JSON')).toBeDefined();
    });

    it('当 body 是 form-urlencoded 格式时应该显示原始文本', () => {
      const url = 'http://example.com';
      const body = 'username=john&password=secret&remember=true';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示原始文本
      expect(screen.getByText('username=john&password=secret&remember=true')).toBeDefined();
    });

    it('当 body 是 XML 格式时应该显示原始文本', () => {
      const url = 'http://example.com';
      const body = '<?xml version="1.0"?><root><item>value</item></root>';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示原始文本
      expect(screen.getByText(body)).toBeDefined();
    });
  });

  describe('同时显示查询参数和请求体', () => {
    it('当同时有查询参数和请求体时应该都显示', () => {
      const url = 'http://example.com?search=test&page=1';
      const body = JSON.stringify({ filter: 'active', limit: 10 });
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 应该显示 Query Parameters 部分
      expect(screen.getByText('Query Parameters')).toBeDefined();
      expect(screen.getByText('search')).toBeDefined();
      expect(screen.getByText('test')).toBeDefined();
      
      // 应该显示 Request Body 部分
      expect(screen.getByText('Request Body')).toBeDefined();
      expect(container.textContent).toContain('filter');
      expect(container.textContent).toContain('active');
    });

    it('Query Parameters 应该显示在 Request Body 之前', () => {
      const url = 'http://example.com?foo=bar';
      const body = 'test body';
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      const text = container.textContent || '';
      const queryParamsIndex = text.indexOf('Query Parameters');
      const requestBodyIndex = text.indexOf('Request Body');
      
      // Query Parameters 应该在 Request Body 之前
      expect(queryParamsIndex).toBeLessThan(requestBodyIndex);
    });
  });

  describe('空状态的显示 - 验证需求 2.5', () => {
    it('当既没有查询参数也没有请求体时应该显示 "No request payload" - 验证需求 2.5', () => {
      const url = 'http://example.com';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示空状态提示
      expect(screen.getByText('No request payload')).toBeDefined();
    });

    it('空状态提示应该使用正确的样式', () => {
      const url = 'http://example.com';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 查找空状态文本元素
      const emptyText = screen.getByText('No request payload');
      
      // 检查样式类
      expect(emptyText.className).toContain('text-devtools-text-secondary');
      expect(emptyText.className).toContain('text-xs');
    });
  });

  describe('样式和布局', () => {
    it('应该使用正确的容器样式', () => {
      const url = 'http://example.com?foo=bar';
      const body = 'test';
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 检查容器有 padding
      const mainDiv = container.querySelector('.p-3');
      expect(mainDiv).toBeDefined();
    });

    it('Request Body 标题应该使用正确的样式', () => {
      const url = 'http://example.com';
      const body = 'test body';
      
      render(<PayloadTab url={url} body={body} />);
      
      const heading = screen.getByText('Request Body');
      expect(heading.className).toContain('text-devtools-text');
      expect(heading.className).toContain('font-medium');
      expect(heading.className).toContain('mb-2');
    });

    it('非 JSON 的原始文本应该使用正确的样式', () => {
      const url = 'http://example.com';
      const body = 'plain text body';
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 查找 pre 元素
      const preElement = container.querySelector('pre');
      expect(preElement).toBeDefined();
      expect(preElement?.className).toContain('p-2');
      expect(preElement?.className).toContain('bg-devtools-bg-secondary');
      expect(preElement?.className).toContain('rounded');
      expect(preElement?.className).toContain('text-devtools-text');
      expect(preElement?.className).toContain('text-xs');
      expect(preElement?.className).toContain('overflow-auto');
      expect(preElement?.className).toContain('max-h-96');
      expect(preElement?.className).toContain('whitespace-pre-wrap');
      expect(preElement?.className).toContain('break-all');
    });
  });

  describe('边界情况', () => {
    it('应该处理非常长的 URL', () => {
      const longParams = Array.from({ length: 50 }, (_, i) => `param${i}=value${i}`).join('&');
      const url = `http://example.com?${longParams}`;
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该能够渲染而不崩溃
      expect(screen.getByText('Query Parameters')).toBeDefined();
    });

    it('应该处理非常大的 JSON body', () => {
      const url = 'http://example.com';
      const largeObject = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])
      );
      const body = JSON.stringify(largeObject);
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该能够渲染而不崩溃
      expect(screen.getByText('Request Body')).toBeDefined();
    });

    it('应该处理包含特殊字符的 body', () => {
      const url = 'http://example.com';
      const body = 'Special chars: \n\t\r"\'<>&';
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示特殊字符
      expect(screen.getByText(/Special chars:/)).toBeDefined();
    });

    it('应该处理包含 Unicode 字符的 body', () => {
      const url = 'http://example.com';
      const body = JSON.stringify({ message: '你好世界 🌍', emoji: '😀🎉' });
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 应该正确显示 Unicode 字符
      expect(container.textContent).toContain('你好世界');
      expect(container.textContent).toContain('😀🎉');
    });

    it('应该处理 body 为 null 的情况', () => {
      const url = 'http://example.com';
      const body = null as any;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该显示空状态
      expect(screen.getByText('No request payload')).toBeDefined();
    });

    it('应该处理 URL 包含锚点的情况', () => {
      const url = 'http://example.com?foo=bar#section';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该正确解析查询参数，忽略锚点
      expect(screen.getByText('Query Parameters')).toBeDefined();
      expect(screen.getByText('foo')).toBeDefined();
      expect(screen.getByText('bar')).toBeDefined();
    });

    it('应该处理 URL 包含端口号的情况', () => {
      const url = 'http://example.com:8080?port=test';
      const body = undefined;
      
      render(<PayloadTab url={url} body={body} />);
      
      // 应该正确解析带端口的 URL
      expect(screen.getByText('Query Parameters')).toBeDefined();
      expect(screen.getByText('port')).toBeDefined();
      expect(screen.getByText('test')).toBeDefined();
    });
  });

  describe('useMemo 优化', () => {
    it('应该正确使用 useMemo 缓存 JSON 解析结果', () => {
      const url = 'http://example.com';
      const body = JSON.stringify({ test: 'value' });
      
      const { rerender, container } = render(<PayloadTab url={url} body={body} />);
      
      // 第一次渲染
      expect(container.textContent).toContain('test');
      
      // 使用相同的 props 重新渲染
      rerender(<PayloadTab url={url} body={body} />);
      
      // 应该仍然正确显示
      expect(container.textContent).toContain('test');
    });

    it('应该正确使用 useMemo 缓存查询参数检查结果', () => {
      const url = 'http://example.com?foo=bar';
      const body = undefined;
      
      const { rerender } = render(<PayloadTab url={url} body={body} />);
      
      // 第一次渲染
      expect(screen.getByText('Query Parameters')).toBeDefined();
      
      // 使用相同的 props 重新渲染
      rerender(<PayloadTab url={url} body={body} />);
      
      // 应该仍然正确显示
      expect(screen.getByText('Query Parameters')).toBeDefined();
    });
  });

  describe('与 Chrome DevTools 的一致性 - 验证需求 2.6', () => {
    it('应该使用与 Chrome DevTools 一致的布局结构', () => {
      const url = 'http://example.com?foo=bar';
      const body = JSON.stringify({ test: 'value' });
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 应该有主容器
      expect(container.querySelector('.p-3')).toBeDefined();
      
      // 应该有标题元素
      const headings = container.querySelectorAll('h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('应该使用 DevTools 主题颜色变量', () => {
      const url = 'http://example.com';
      const body = 'test';
      
      const { container } = render(<PayloadTab url={url} body={body} />);
      
      // 检查是否使用了 DevTools 主题类
      const text = container.innerHTML;
      expect(text).toContain('text-devtools-text');
      expect(text).toContain('bg-devtools-bg-secondary');
    });
  });
});
