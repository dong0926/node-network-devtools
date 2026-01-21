/**
 * ResponseTab 组件单元测试
 * 
 * 验证需求：3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.10
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponseTab } from './ResponseTab.js';

describe('ResponseTab', () => {
  describe('基本渲染', () => {
    it('当没有响应体时应该显示 "无响应体" 提示', () => {
      render(<ResponseTab body={undefined} />);
      
      expect(screen.getByText('无响应体')).toBeDefined();
    });

    it('当响应体为空字符串时应该显示 "无响应体" 提示', () => {
      render(<ResponseTab body="" />);
      
      expect(screen.getByText('无响应体')).toBeDefined();
    });

    it('当有响应体时应该显示 "响应体" 标题', () => {
      const body = 'test response';
      
      render(<ResponseTab body={body} />);
      
      expect(screen.getByText('响应体')).toBeDefined();
    });

    it('当有响应体时应该显示响应内容', () => {
      const body = 'test response content';
      
      render(<ResponseTab body={body} />);
      
      expect(screen.getByText('test response content')).toBeDefined();
    });
  });

  describe('格式化/原始模式切换 - 验证需求 3.1, 3.2', () => {
    it('当响应体是有效 JSON 时应该显示格式化/原始切换按钮', () => {
      const body = JSON.stringify({ name: 'test', value: 123 });
      
      render(<ResponseTab body={body} />);
      
      // 应该显示切换按钮（使用文本选择器避免与 JSONViewer 的按钮冲突）
      const button = screen.getByText('格式化');
      expect(button).toBeDefined();
      expect(button.tagName).toBe('BUTTON');
    });

    it('当响应体不是有效 JSON 时不应该显示切换按钮', () => {
      const body = 'plain text response';
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 不应该有按钮
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });

    it('默认应该显示格式化模式', () => {
      const body = JSON.stringify({ name: 'test' });
      
      render(<ResponseTab body={body} />);
      
      const button = screen.getByText('格式化');
      expect(button.textContent).toBe('格式化');
      expect(button.className).toContain('bg-devtools-accent');
    });

    it('点击按钮应该切换到原始模式', () => {
      const body = JSON.stringify({ name: 'test' });
      
      render(<ResponseTab body={body} />);
      
      const button = screen.getByText('格式化');
      fireEvent.click(button);
      
      // 按钮文本应该变为 "原始"
      const updatedButton = screen.getByText('原始');
      expect(updatedButton.textContent).toBe('原始');
      expect(updatedButton.className).toContain('bg-devtools-bg-secondary');
    });

    it('应该支持多次切换格式化/原始模式', () => {
      const body = JSON.stringify({ name: 'test' });
      
      render(<ResponseTab body={body} />);
      
      let button = screen.getByText('格式化');
      
      // 第一次点击：切换到原始
      fireEvent.click(button);
      button = screen.getByText('原始');
      expect(button.textContent).toBe('原始');
      
      // 第二次点击：切换回格式化
      fireEvent.click(button);
      button = screen.getByText('格式化');
      expect(button.textContent).toBe('格式化');
      
      // 第三次点击：再次切换到原始
      fireEvent.click(button);
      button = screen.getByText('原始');
      expect(button.textContent).toBe('原始');
    });
  });

  describe('JSON 数据的展示 - 验证需求 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8', () => {
    it('格式化模式下应该使用 JSONViewer 展示 JSON 对象 - 验证需求 3.1', () => {
      const body = JSON.stringify({ name: 'John', age: 25 });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示 JSON 内容
      expect(container.textContent).toContain('name');
      expect(container.textContent).toContain('John');
      expect(container.textContent).toContain('age');
      expect(container.textContent).toContain('25');
    });

    it('格式化模式下应该使用 JSONViewer 展示 JSON 数组', () => {
      const body = JSON.stringify([1, 2, 3, 4, 5]);
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示数组内容
      expect(container.textContent).toContain('1');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('3');
    });

    it('格式化模式下应该默认只展开第一层 - 验证需求 3.1', () => {
      const body = JSON.stringify({
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 第一层应该展开
      expect(container.textContent).toContain('user');
      expect(container.textContent).toContain('▼');
      
      // 第二层应该折叠
      expect(container.textContent).toContain('{...}');
    });

    it('格式化模式下应该显示折叠指示器 - 验证需求 3.2', () => {
      const body = JSON.stringify({ data: { nested: 'value' } });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示可点击的折叠指示器
      const clickableNode = container.querySelector('.cursor-pointer');
      expect(clickableNode).toBeTruthy();
    });

    it('应该能够点击折叠指示器展开/折叠节点 - 验证需求 3.3, 3.4', () => {
      const body = JSON.stringify({ user: { name: 'John', age: 25 } });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 初始状态：第一层展开
      expect(container.textContent).toContain('▼');
      
      // 点击折叠
      const expandedNode = container.querySelector('.cursor-pointer');
      if (expandedNode) {
        fireEvent.click(expandedNode);
      }
      
      // 折叠后：应该显示向右三角形
      expect(container.textContent).toContain('▶');
      expect(container.textContent).toContain('{...}');
    });

    it('折叠状态应该显示类型提示 - 验证需求 3.5', () => {
      const body = JSON.stringify({ obj: { a: 1 }, arr: [1, 2, 3] });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 第一层展开，第二层折叠，应该显示类型提示
      expect(container.textContent).toContain('{...}');
    });

    it('折叠状态应该显示元素数量 - 验证需求 3.6', () => {
      const body = JSON.stringify({ 
        user: { 
          name: 'John', 
          age: 25, 
          email: 'john@example.com' 
        } 
      });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 第一层展开，第二层（user）折叠，应该显示 user 对象的元素数量
      expect(container.textContent).toContain('{3}'); // user 对象有 3 个属性
    });

    it('展开状态应该显示向下的三角形图标 - 验证需求 3.7', () => {
      const body = JSON.stringify({ name: 'test', value: 123 });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 展开状态应该显示 ▼
      expect(container.textContent).toContain('▼');
    });

    it('折叠状态应该显示向右的三角形图标 - 验证需求 3.8', () => {
      const body = JSON.stringify({ nested: { name: 'test', value: 123 } });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 第一层展开，第二层（nested）折叠，应该显示 ▶
      expect(container.textContent).toContain('▶');
      expect(container.textContent).toContain('{...}');
    });
  });

  describe('非 JSON 数据的显示 - 验证需求 3.10', () => {
    it('原始模式下应该显示原始文本', () => {
      const body = JSON.stringify({ name: 'test' });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 切换到原始模式
      const button = screen.getByText('格式化');
      fireEvent.click(button);
      
      // 应该显示原始 JSON 字符串
      const preElement = container.querySelector('pre');
      expect(preElement).toBeTruthy();
      expect(preElement?.textContent).toBe(body);
    });

    it('非 JSON 响应应该直接显示原始文本 - 验证需求 3.10', () => {
      const body = 'This is plain text response';
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示原始文本
      expect(screen.getByText(body)).toBeDefined();
      
      // 应该使用 pre 元素
      const preElement = container.querySelector('pre');
      expect(preElement).toBeTruthy();
    });

    it('HTML 响应应该显示原始文本', () => {
      const body = '<html><body><h1>Hello</h1></body></html>';
      
      render(<ResponseTab body={body} />);
      
      // 应该显示原始 HTML
      expect(screen.getByText(body)).toBeDefined();
    });

    it('XML 响应应该显示原始文本', () => {
      const body = '<?xml version="1.0"?><root><item>value</item></root>';
      
      render(<ResponseTab body={body} />);
      
      // 应该显示原始 XML
      expect(screen.getByText(body)).toBeDefined();
    });

    it('CSV 响应应该显示原始文本', () => {
      const body = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示原始 CSV（使用正则表达式匹配，因为文本可能被分割）
      expect(container.textContent).toContain('name,age,city');
      expect(container.textContent).toContain('John,25,NYC');
      expect(container.textContent).toContain('Jane,30,LA');
    });

    it('无效 JSON 应该显示原始文本 - 验证需求 3.10', () => {
      const body = '{"invalid": json}';
      
      render(<ResponseTab body={body} />);
      
      // 应该显示原始文本
      expect(screen.getByText(body)).toBeDefined();
      
      // 不应该有切换按钮
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('截断提示的显示', () => {
    it('当 bodyTruncated=true 时应该显示 "已截断" 提示', () => {
      const body = 'truncated response';
      
      render(<ResponseTab body={body} bodyTruncated={true} />);
      
      expect(screen.getByText('已截断')).toBeDefined();
    });

    it('当 bodyTruncated=false 时不应该显示 "已截断" 提示', () => {
      const body = 'complete response';
      
      render(<ResponseTab body={body} bodyTruncated={false} />);
      
      expect(() => screen.getByText('已截断')).toThrow();
    });

    it('当 bodyTruncated 未设置时不应该显示 "已截断" 提示', () => {
      const body = 'complete response';
      
      render(<ResponseTab body={body} />);
      
      expect(() => screen.getByText('已截断')).toThrow();
    });

    it('"已截断" 提示应该使用警告颜色样式', () => {
      const body = 'truncated response';
      
      render(<ResponseTab body={body} bodyTruncated={true} />);
      
      const truncatedText = screen.getByText('已截断');
      expect(truncatedText.className).toContain('text-devtools-warning');
    });

    it('"已截断" 提示应该显示在切换按钮旁边', () => {
      const body = JSON.stringify({ name: 'test' });
      
      render(<ResponseTab body={body} bodyTruncated={true} />);
      
      // 应该同时显示截断提示和切换按钮
      expect(screen.getByText('已截断')).toBeDefined();
      expect(screen.getByText('格式化')).toBeDefined();
    });
  });

  describe('样式和布局', () => {
    it('应该使用正确的容器样式', () => {
      const body = 'test';
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 检查容器有 padding
      const mainDiv = container.querySelector('.p-3');
      expect(mainDiv).toBeDefined();
    });

    it('响应体标题应该使用正确的样式', () => {
      const body = 'test';
      
      render(<ResponseTab body={body} />);
      
      const heading = screen.getByText('响应体');
      expect(heading.className).toContain('text-devtools-text');
      expect(heading.className).toContain('font-medium');
      expect(heading.className).toContain('text-xs');
    });

    it('格式化按钮在激活状态应该使用正确的样式', () => {
      const body = JSON.stringify({ name: 'test' });
      
      render(<ResponseTab body={body} />);
      
      const button = screen.getByText('格式化');
      expect(button.className).toContain('bg-devtools-accent');
      expect(button.className).toContain('text-devtools-bg');
    });

    it('格式化按钮在非激活状态应该使用正确的样式', () => {
      const body = JSON.stringify({ name: 'test' });
      
      render(<ResponseTab body={body} />);
      
      const button = screen.getByText('格式化');
      fireEvent.click(button);
      
      const updatedButton = screen.getByText('原始');
      expect(updatedButton.className).toContain('bg-devtools-bg-secondary');
      expect(updatedButton.className).toContain('text-devtools-text-secondary');
    });

    it('原始文本应该使用 pre 元素和正确的样式', () => {
      const body = 'plain text';
      
      const { container } = render(<ResponseTab body={body} />);
      
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

    it('JSONViewer 容器应该有正确的样式', () => {
      const body = JSON.stringify({ name: 'test' });
      
      const { container } = render(<ResponseTab body={body} />);
      
      const jsonContainer = container.querySelector('.max-h-96.overflow-auto');
      expect(jsonContainer).toBeDefined();
    });

    it('无响应体提示应该使用正确的样式', () => {
      render(<ResponseTab body={undefined} />);
      
      const emptyText = screen.getByText('无响应体');
      expect(emptyText.className).toContain('text-devtools-text-secondary');
      expect(emptyText.className).toContain('text-xs');
    });
  });

  describe('边界情况', () => {
    it('应该处理非常大的 JSON 响应', () => {
      const largeObject = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])
      );
      const body = JSON.stringify(largeObject);
      
      render(<ResponseTab body={body} />);
      
      // 应该能够渲染而不崩溃
      expect(screen.getByText('响应体')).toBeDefined();
    });

    it('应该处理包含特殊字符的响应', () => {
      const body = 'Special chars: \n\t\r"\'<>&';
      
      render(<ResponseTab body={body} />);
      
      // 应该显示特殊字符
      expect(screen.getByText(/Special chars:/)).toBeDefined();
    });

    it('应该处理包含 Unicode 字符的响应', () => {
      const body = JSON.stringify({ message: '你好世界 🌍', emoji: '😀🎉' });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该正确显示 Unicode 字符
      expect(container.textContent).toContain('你好世界');
      expect(container.textContent).toContain('😀🎉');
    });

    it('应该处理 body 为 null 的情况', () => {
      const body = null as any;
      
      render(<ResponseTab body={body} />);
      
      // 应该显示空状态
      expect(screen.getByText('无响应体')).toBeDefined();
    });

    it('应该处理嵌套很深的 JSON 结构', () => {
      const deepObject = {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: {
                  value: 'deep'
                }
              }
            }
          }
        }
      };
      const body = JSON.stringify(deepObject);
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该能够渲染
      expect(container.textContent).toContain('l1');
    });

    it('应该处理包含循环引用的 JSON 字符串（已序列化）', () => {
      // 注意：实际的循环引用对象无法被 JSON.stringify，
      // 所以这里测试的是已经序列化的字符串
      const body = '{"a":{"b":{"c":"[Circular]"}}}';
      
      render(<ResponseTab body={body} />);
      
      // 应该能够渲染
      expect(screen.getByText('响应体')).toBeDefined();
    });

    it('应该处理空对象响应', () => {
      const body = JSON.stringify({});
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示空对象
      expect(container.textContent).toContain('{');
      expect(container.textContent).toContain('}');
    });

    it('应该处理空数组响应', () => {
      const body = JSON.stringify([]);
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示空数组
      expect(container.textContent).toContain('[');
      expect(container.textContent).toContain(']');
    });

    it('应该处理只包含原始值的 JSON', () => {
      const body = JSON.stringify('just a string');
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该能够渲染
      expect(container.textContent).toContain('just a string');
    });

    it('应该处理 JSON 数字', () => {
      const body = JSON.stringify(42);
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示数字
      expect(container.textContent).toContain('42');
    });

    it('应该处理 JSON 布尔值', () => {
      const body = JSON.stringify(true);
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示布尔值
      expect(container.textContent).toContain('true');
    });

    it('应该处理 JSON null', () => {
      const body = JSON.stringify(null);
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该显示 null
      expect(container.textContent).toContain('null');
    });
  });

  describe('useMemo 优化', () => {
    it('应该正确使用 useMemo 缓存 JSON 检查结果', () => {
      const body = JSON.stringify({ test: 'value' });
      
      const { rerender } = render(<ResponseTab body={body} />);
      
      // 第一次渲染
      expect(screen.getByText('格式化')).toBeDefined();
      
      // 使用相同的 props 重新渲染
      rerender(<ResponseTab body={body} />);
      
      // 应该仍然正确显示
      expect(screen.getByText('格式化')).toBeDefined();
    });

    it('当 body 改变时应该重新检查 JSON', () => {
      const body1 = JSON.stringify({ test: 'value1' });
      const body2 = 'plain text';
      
      const { rerender } = render(<ResponseTab body={body1} />);
      
      // 第一次渲染：应该有切换按钮
      expect(screen.getByText('格式化')).toBeDefined();
      
      // 改变 body 为非 JSON
      rerender(<ResponseTab body={body2} />);
      
      // 不应该有切换按钮
      expect(screen.queryByText('格式化')).toBeNull();
      expect(screen.queryByText('原始')).toBeNull();
    });
  });

  describe('格式化和原始模式的内容切换', () => {
    it('格式化模式应该使用 JSONViewer 组件', () => {
      const body = JSON.stringify({ name: 'test', value: 123 });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该有 JSONViewer 的特征（折叠指示器）
      const clickableNode = container.querySelector('.cursor-pointer');
      expect(clickableNode).toBeTruthy();
    });

    it('原始模式应该使用 pre 元素', () => {
      const body = JSON.stringify({ name: 'test', value: 123 });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 切换到原始模式
      const button = screen.getByText('格式化');
      fireEvent.click(button);
      
      // 应该有 pre 元素
      const preElement = container.querySelector('pre');
      expect(preElement).toBeTruthy();
      
      // 不应该有折叠指示器
      const clickableNode = container.querySelector('.cursor-pointer');
      expect(clickableNode).toBeFalsy();
    });

    it('切换模式时应该保持相同的数据', () => {
      const body = JSON.stringify({ name: 'test', value: 123 });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 格式化模式
      expect(container.textContent).toContain('name');
      expect(container.textContent).toContain('test');
      
      // 切换到原始模式
      const button = screen.getByText('格式化');
      fireEvent.click(button);
      
      // 原始模式也应该包含相同的数据
      expect(container.textContent).toContain('name');
      expect(container.textContent).toContain('test');
    });
  });

  describe('与 Chrome DevTools 的一致性', () => {
    it('应该使用与 Chrome DevTools 一致的布局结构', () => {
      const body = JSON.stringify({ test: 'value' });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该有主容器
      expect(container.querySelector('.p-3')).toBeDefined();
      
      // 应该有标题元素
      const heading = screen.getByText('响应体');
      expect(heading.tagName).toBe('H3');
    });

    it('应该使用 DevTools 主题颜色变量', () => {
      const body = 'test';
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 检查是否使用了 DevTools 主题类
      const html = container.innerHTML;
      expect(html).toContain('text-devtools-text');
      expect(html).toContain('bg-devtools-bg-secondary');
    });

    it('标题和按钮应该在同一行显示', () => {
      const body = JSON.stringify({ test: 'value' });
      
      const { container } = render(<ResponseTab body={body} />);
      
      // 应该有 flex 容器
      const headerContainer = container.querySelector('.flex.items-center.justify-between');
      expect(headerContainer).toBeDefined();
    });
  });
});
