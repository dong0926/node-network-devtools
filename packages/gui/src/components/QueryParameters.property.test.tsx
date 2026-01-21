/**
 * QueryParameters 组件属性测试
 * 
 * 使用 fast-check 进行基于属性的测试
 * 
 * **属性 5：查询参数条件渲染**
 * **验证：需求 2.1, 2.4**
 */

import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { QueryParameters } from './QueryParameters.js';

describe('QueryParameters 属性测试', () => {
  /**
   * 属性 5：查询参数条件渲染
   * 
   * 对于任意 URL，Query Parameters 部分的显示状态应该等于 URL 是否包含查询参数
   * 
   * **Validates: Requirements 2.1, 2.4**
   */
  it('属性 5：Query Parameters 部分的显示状态应该等于 URL 是否包含查询参数', () => {
    fc.assert(
      fc.property(
        // 生成任意的 URL 和查询参数
        fc.record({
          baseUrl: fc.webUrl(),
          hasParams: fc.boolean(),
          params: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ maxLength: 50 })
          ),
        }),
        ({ baseUrl, hasParams, params }) => {
          // 构建 URL
          let url = baseUrl;
          if (hasParams && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams(params);
            url = `${baseUrl}?${searchParams.toString()}`;
          }

          // 渲染组件
          const { container } = render(<QueryParameters url={url} />);

          // 检查是否有查询参数
          const actualHasParams = url.includes('?') && new URL(url).searchParams.toString().length > 0;

          // 检查组件是否渲染
          const isRendered = container.firstChild !== null;

          // 验证：显示状态应该等于是否包含查询参数
          return isRendered === actualHasParams;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：查询参数解析完整性
   * 
   * 对于任意包含查询参数的 URL，解析后的参数列表应该包含 URL 中的所有参数
   */
  it('属性：解析后的参数应该包含 URL 中的所有参数', () => {
    fc.assert(
      fc.property(
        // 生成包含查询参数的 URL
        fc.record({
          baseUrl: fc.constant('http://example.com'),
          params: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('&') && !s.includes('=')),
            fc.string({ maxLength: 50 }),
            { minKeys: 1, maxKeys: 10 }
          ),
        }),
        ({ baseUrl, params }) => {
          // 构建 URL
          const searchParams = new URLSearchParams(params);
          const url = `${baseUrl}?${searchParams.toString()}`;

          // 渲染组件
          const { container } = render(<QueryParameters url={url} />);

          // 如果没有参数，跳过
          if (Object.keys(params).length === 0) {
            return true;
          }

          // 检查所有参数键是否都在渲染的内容中
          const renderedText = container.textContent || '';
          
          return Object.keys(params).every(key => {
            // 键应该在渲染的文本中
            return renderedText.includes(key);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：空 URL 或无效 URL 不应该渲染
   * 
   * 对于任意无效的 URL，组件应该返回 null 而不是抛出错误
   */
  it('属性：无效 URL 应该优雅地处理', () => {
    fc.assert(
      fc.property(
        // 生成可能无效的字符串
        fc.string({ maxLength: 100 }),
        (invalidUrl) => {
          // 渲染组件（不应该抛出错误）
          render(<QueryParameters url={invalidUrl} />);

          // 应该返回 null 或空内容
          return true; // 只要不抛出错误就通过
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：重复参数应该全部显示
   * 
   * 对于包含重复参数名的 URL，所有值都应该被显示
   */
  it('属性：重复参数的所有值都应该被显示', () => {
    fc.assert(
      fc.property(
        // 生成包含重复参数的 URL
        fc.record({
          baseUrl: fc.constant('http://example.com'),
          key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          values: fc.array(
            fc.string({ minLength: 1, maxLength: 20 }),
            { minLength: 2, maxLength: 5 }
          ),
        }),
        ({ baseUrl, key, values }) => {
          // 构建包含重复参数的 URL
          const params = values.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
          const url = `${baseUrl}?${params}`;

          // 渲染组件
          const { container } = render(<QueryParameters url={url} />);

          // 检查表格行数（不包括表头）
          const rows = container.querySelectorAll('tbody tr');
          
          // 行数应该等于值的数量
          return rows.length === values.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：URL 编码的参数应该被正确解码
   * 
   * 对于任意包含特殊字符的参数值，应该正确解码并显示
   */
  it('属性：URL 编码的参数应该被正确解码', () => {
    fc.assert(
      fc.property(
        // 生成包含特殊字符的参数
        fc.record({
          baseUrl: fc.constant('http://example.com'),
          key: fc.string({ minLength: 1, maxLength: 10 }),
          value: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        ({ baseUrl, key, value }) => {
          // 构建 URL（自动编码）
          const searchParams = new URLSearchParams();
          searchParams.set(key, value);
          const url = `${baseUrl}?${searchParams.toString()}`;

          // 渲染组件
          const { container } = render(<QueryParameters url={url} />);

          // 检查解码后的值是否在渲染的内容中
          const renderedText = container.textContent || '';
          
          // 值应该以解码形式出现
          return renderedText.includes(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：空参数值应该显示为 (empty)
   * 
   * 对于任意包含空值的参数，应该显示 (empty) 提示
   */
  it('属性：空参数值应该显示为 (empty)', () => {
    fc.assert(
      fc.property(
        // 生成包含空值的参数
        fc.record({
          baseUrl: fc.constant('http://example.com'),
          key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        }),
        ({ baseUrl, key }) => {
          // 构建包含空值的 URL
          const url = `${baseUrl}?${encodeURIComponent(key)}=`;

          // 渲染组件
          const { container } = render(<QueryParameters url={url} />);

          // 检查是否显示 (empty)
          const renderedText = container.textContent || '';
          
          return renderedText.includes('(empty)');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：表格结构应该始终正确
   * 
   * 对于任意有效的 URL，如果渲染了组件，应该包含正确的表格结构
   */
  it('属性：渲染的组件应该包含正确的表格结构', () => {
    fc.assert(
      fc.property(
        // 生成包含查询参数的 URL
        fc.record({
          baseUrl: fc.webUrl(),
          params: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ maxLength: 50 }),
            { minKeys: 1, maxKeys: 10 }
          ),
        }),
        ({ baseUrl, params }) => {
          // 构建 URL
          const searchParams = new URLSearchParams(params);
          const url = `${baseUrl}?${searchParams.toString()}`;

          // 渲染组件
          const { container } = render(<QueryParameters url={url} />);

          // 如果组件被渲染，应该包含表格
          if (container.firstChild !== null) {
            const table = container.querySelector('table');
            const thead = container.querySelector('thead');
            const tbody = container.querySelector('tbody');
            
            return table !== null && thead !== null && tbody !== null;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
