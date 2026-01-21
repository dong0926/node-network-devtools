/**
 * PayloadTab 组件属性测试
 * 
 * Feature: gui-devtools-enhancements
 * 使用 fast-check 进行基于属性的测试
 * 
 * 测试属性：
 * - 属性 6：请求体条件渲染
 */

import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { PayloadTab } from './PayloadTab.js';

describe('PayloadTab 属性测试', () => {
  /**
   * 属性 6：请求体条件渲染
   * 
   * **Validates: Requirements 2.3, 2.5**
   * 
   * *对于任意* 请求，Request Body 部分的显示状态应该等于请求是否包含非空 body
   */
  it('属性 6：Request Body 部分的显示状态应该等于请求是否包含非空 body', () => {
    fc.assert(
      fc.property(
        // 生成任意的 URL 和 body
        fc.record({
          url: fc.webUrl(),
          hasBody: fc.boolean(),
          body: fc.oneof(
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.jsonValue().map(v => JSON.stringify(v))
          ),
        }),
        ({ url, hasBody, body }) => {
          // 根据 hasBody 决定是否传递 body
          const actualBody = hasBody ? body : undefined;

          // 渲染组件
          const { container } = render(<PayloadTab url={url} body={actualBody} />);

          // 检查是否显示 "Request Body" 标题
          const renderedText = container.textContent || '';
          const hasRequestBodySection = renderedText.includes('Request Body');

          // 验证：显示状态应该等于是否包含非空 body
          return hasRequestBodySection === hasBody;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6a：空字符串 body 应该被视为没有 body
   * 
   * 边界情况：空字符串是 falsy 值，应该显示 "No request payload"
   */
  it('属性 6a：空字符串 body 应该显示 "No request payload"（如果没有查询参数）', () => {
    fc.assert(
      fc.property(
        fc.webUrl().filter(url => {
          // 过滤掉包含查询参数的 URL
          try {
            const urlObj = new URL(url);
            return urlObj.search.length <= 1;
          } catch {
            return true;
          }
        }),
        (url) => {
          // 传递空字符串作为 body
          const { container } = render(<PayloadTab url={url} body="" />);

          // 应该显示 "No request payload" 提示
          const renderedText = container.textContent || '';
          return renderedText.includes('No request payload');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6b：undefined body 不应该显示 Request Body 部分
   */
  it('属性 6b：undefined body 不应该显示 Request Body 部分', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (url) => {
          // 不传递 body（undefined）
          const { container } = render(<PayloadTab url={url} body={undefined} />);

          // 不应该显示 Request Body 部分
          const renderedText = container.textContent || '';
          return !renderedText.includes('Request Body');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6c：有 body 时应该显示内容而不是 "No request body"
   */
  it('属性 6c：有 body 时不应该显示 "No request body" 提示', () => {
    fc.assert(
      fc.property(
        fc.record({
          url: fc.webUrl(),
          body: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        ({ url, body }) => {
          const { container } = render(<PayloadTab url={url} body={body} />);

          // 不应该显示 "No request body" 提示
          const renderedText = container.textContent || '';
          return !renderedText.includes('No request body');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6d：JSON body 应该使用 JSONViewer 渲染
   */
  it('属性 6d：有效的 JSON body 应该使用 JSONViewer 渲染', () => {
    fc.assert(
      fc.property(
        fc.record({
          url: fc.webUrl(),
          jsonData: fc.jsonValue(),
        }),
        ({ url, jsonData }) => {
          const body = JSON.stringify(jsonData);

          const { container } = render(<PayloadTab url={url} body={body} />);

          // 应该显示 Request Body 部分
          const renderedText = container.textContent || '';
          const hasRequestBody = renderedText.includes('Request Body');

          // 如果是对象或数组，应该有折叠指示器（JSONViewer 的特征）
          const isComplexType = typeof jsonData === 'object' && jsonData !== null;
          if (isComplexType) {
            const hasTriangles = renderedText.includes('▼') || renderedText.includes('▶');
            return hasRequestBody && hasTriangles;
          }

          return hasRequestBody;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6e：非 JSON body 应该显示为原始文本
   */
  it('属性 6e：非 JSON body 应该显示为原始文本', () => {
    fc.assert(
      fc.property(
        fc.record({
          url: fc.webUrl(),
          body: fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            // 过滤掉有效的 JSON 字符串
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
        }),
        ({ url, body }) => {
          const { container } = render(<PayloadTab url={url} body={body} />);

          // 应该显示 Request Body 部分
          const renderedText = container.textContent || '';
          const hasRequestBody = renderedText.includes('Request Body');

          // 应该包含原始文本内容
          const hasBodyContent = renderedText.includes(body);

          return hasRequestBody && hasBodyContent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6f：同时有查询参数和 body 时，两者都应该显示
   */
  it('属性 6f：同时有查询参数和 body 时，两者都应该显示', () => {
    fc.assert(
      fc.property(
        fc.record({
          baseUrl: fc.constant('http://example.com'),
          params: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.string({ maxLength: 20 }),
            { minKeys: 1, maxKeys: 5 }
          ),
          body: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        ({ baseUrl, params, body }) => {
          // 构建包含查询参数的 URL
          const searchParams = new URLSearchParams(params);
          const url = `${baseUrl}?${searchParams.toString()}`;

          const { container } = render(<PayloadTab url={url} body={body} />);

          const renderedText = container.textContent || '';

          // 应该显示 Query Parameters 部分
          const hasQueryParams = renderedText.includes('Query Parameters');

          // 应该显示 Request Body 部分
          const hasRequestBody = renderedText.includes('Request Body');

          return hasQueryParams && hasRequestBody;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6g：既没有查询参数也没有 body 时，应该显示 "No request payload"
   */
  it('属性 6g：既没有查询参数也没有 body 时，应该显示 "No request payload"', () => {
    fc.assert(
      fc.property(
        fc.webUrl().filter(url => {
          // 过滤掉包含查询参数的 URL
          try {
            const urlObj = new URL(url);
            return urlObj.search.length <= 1;
          } catch {
            return true;
          }
        }),
        (url) => {
          // 不传递 body
          const { container } = render(<PayloadTab url={url} body={undefined} />);

          const renderedText = container.textContent || '';

          // 应该显示 "No request payload" 提示
          return renderedText.includes('No request payload');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6h：只有查询参数没有 body 时，不应该显示 "No request payload"
   */
  it('属性 6h：只有查询参数没有 body 时，不应该显示 "No request payload"', () => {
    fc.assert(
      fc.property(
        fc.record({
          baseUrl: fc.constant('http://example.com'),
          params: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.string({ maxLength: 20 }),
            { minKeys: 1, maxKeys: 5 }
          ),
        }),
        ({ baseUrl, params }) => {
          // 构建包含查询参数的 URL
          const searchParams = new URLSearchParams(params);
          const url = `${baseUrl}?${searchParams.toString()}`;

          // 不传递 body
          const { container } = render(<PayloadTab url={url} body={undefined} />);

          const renderedText = container.textContent || '';

          // 不应该显示 "No request payload" 提示
          return !renderedText.includes('No request payload');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6i：body 内容应该完整显示
   */
  it('属性 6i：body 内容应该完整显示（对于非 JSON）', () => {
    fc.assert(
      fc.property(
        fc.record({
          url: fc.webUrl(),
          body: fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
            // 过滤掉有效的 JSON
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
        }),
        ({ url, body }) => {
          const { container } = render(<PayloadTab url={url} body={body} />);

          const renderedText = container.textContent || '';

          // body 内容应该在渲染的文本中
          return renderedText.includes(body);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6j：Request Body 部分应该在 Query Parameters 之后
   */
  it('属性 6j：Request Body 部分应该在 Query Parameters 之后', () => {
    fc.assert(
      fc.property(
        fc.record({
          baseUrl: fc.constant('http://example.com'),
          params: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.string({ maxLength: 20 }),
            { minKeys: 1, maxKeys: 5 }
          ),
          body: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        ({ baseUrl, params, body }) => {
          // 构建包含查询参数的 URL
          const searchParams = new URLSearchParams(params);
          const url = `${baseUrl}?${searchParams.toString()}`;

          const { container } = render(<PayloadTab url={url} body={body} />);

          const renderedText = container.textContent || '';

          // 查找两个部分的位置
          const queryParamsIndex = renderedText.indexOf('Query Parameters');
          const requestBodyIndex = renderedText.indexOf('Request Body');

          // Request Body 应该在 Query Parameters 之后
          return queryParamsIndex !== -1 && 
                 requestBodyIndex !== -1 && 
                 requestBodyIndex > queryParamsIndex;
        }
      ),
      { numRuns: 100 }
    );
  });
});
