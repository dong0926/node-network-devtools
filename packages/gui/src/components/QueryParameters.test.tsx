/**
 * QueryParameters 组件单元测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryParameters } from './QueryParameters.js';

describe('QueryParameters', () => {
  it('应该解析并显示简单的查询参数', () => {
    const url = 'http://example.com?foo=bar&baz=qux';
    render(<QueryParameters url={url} />);

    // 检查标题
    expect(screen.getByText('Query Parameters')).toBeDefined();

    // 检查表头
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Value')).toBeDefined();

    // 检查参数
    expect(screen.getByText('foo')).toBeDefined();
    expect(screen.getByText('bar')).toBeDefined();
    expect(screen.getByText('baz')).toBeDefined();
    expect(screen.getByText('qux')).toBeDefined();
  });

  it('应该处理 URL 编码的参数', () => {
    const url = 'http://example.com?name=%E5%BC%A0%E4%B8%89&city=%E5%8C%97%E4%BA%AC';
    render(<QueryParameters url={url} />);

    // 检查解码后的值
    expect(screen.getByText('name')).toBeDefined();
    expect(screen.getByText('张三')).toBeDefined();
    expect(screen.getByText('city')).toBeDefined();
    expect(screen.getByText('北京')).toBeDefined();
  });

  it('应该处理空参数值', () => {
    const url = 'http://example.com?key1=&key2=value';
    render(<QueryParameters url={url} />);

    // 检查空值显示为 (empty)
    expect(screen.getByText('key1')).toBeDefined();
    expect(screen.getByText('(empty)')).toBeDefined();
    expect(screen.getByText('key2')).toBeDefined();
    expect(screen.getByText('value')).toBeDefined();
  });

  it('应该处理重复的参数名', () => {
    const url = 'http://example.com?tag=a&tag=b&tag=c';
    render(<QueryParameters url={url} />);

    // 检查所有重复的参数都显示
    const tagElements = screen.getAllByText('tag');
    expect(tagElements).toHaveLength(3);
    expect(screen.getByText('a')).toBeDefined();
    expect(screen.getByText('b')).toBeDefined();
    expect(screen.getByText('c')).toBeDefined();
  });

  it('应该处理特殊字符', () => {
    const url = 'http://example.com?query=hello%20world&symbol=%26%3D%3F';
    render(<QueryParameters url={url} />);

    // 检查特殊字符正确解码
    expect(screen.getByText('query')).toBeDefined();
    expect(screen.getByText('hello world')).toBeDefined();
    expect(screen.getByText('symbol')).toBeDefined();
    expect(screen.getByText('&=?')).toBeDefined();
  });

  it('当 URL 没有查询参数时不应该渲染任何内容', () => {
    const url = 'http://example.com';
    const { container } = render(<QueryParameters url={url} />);

    // 组件应该返回 null，不渲染任何内容
    expect(container.firstChild).toBeNull();
  });

  it('当 URL 只有问号但没有参数时不应该渲染任何内容', () => {
    const url = 'http://example.com?';
    const { container } = render(<QueryParameters url={url} />);

    // 组件应该返回 null
    expect(container.firstChild).toBeNull();
  });

  it('应该处理无效的 URL', () => {
    const url = 'not-a-valid-url';
    const { container } = render(<QueryParameters url={url} />);

    // 组件应该优雅地处理错误，返回 null
    expect(container.firstChild).toBeNull();
  });

  it('应该处理包含多个值的复杂查询字符串', () => {
    const url = 'http://example.com?a=1&b=2&c=3&d=4&e=5';
    render(<QueryParameters url={url} />);

    // 检查所有参数都显示
    expect(screen.getByText('a')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('b')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('c')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('d')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('e')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('应该使用正确的样式类', () => {
    const url = 'http://example.com?test=value';
    const { container } = render(<QueryParameters url={url} />);

    // 检查表格结构
    const table = container.querySelector('table');
    expect(table).toBeDefined();
    expect(table?.className).toContain('w-full');
    expect(table?.className).toContain('text-xs');

    // 检查标题样式
    const heading = screen.getByText('Query Parameters');
    expect(heading.className).toContain('text-devtools-text');
    expect(heading.className).toContain('font-medium');
    expect(heading.className).toContain('mb-2');
  });

  it('应该为每个参数行使用唯一的 key', () => {
    const url = 'http://example.com?tag=a&tag=b';
    const { container } = render(<QueryParameters url={url} />);

    // 检查有两行数据（不包括表头）
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
  });

  it('应该处理只有键没有值的参数', () => {
    const url = 'http://example.com?flag&key=value';
    render(<QueryParameters url={url} />);

    // 检查只有键的参数
    expect(screen.getByText('flag')).toBeDefined();
    // 值应该显示为空
    const emptyValues = screen.getAllByText('(empty)');
    expect(emptyValues.length).toBeGreaterThan(0);
  });

  it('应该处理包含 # 锚点的 URL', () => {
    const url = 'http://example.com?foo=bar#section';
    render(<QueryParameters url={url} />);

    // 应该正确解析查询参数，忽略锚点
    expect(screen.getByText('foo')).toBeDefined();
    expect(screen.getByText('bar')).toBeDefined();
  });

  it('应该处理包含端口号的 URL', () => {
    const url = 'http://example.com:8080?port=test';
    render(<QueryParameters url={url} />);

    // 应该正确解析带端口的 URL
    expect(screen.getByText('port')).toBeDefined();
    expect(screen.getByText('test')).toBeDefined();
  });

  it('应该处理包含路径的 URL', () => {
    const url = 'http://example.com/api/users?id=123&name=test';
    render(<QueryParameters url={url} />);

    // 应该正确解析带路径的 URL
    expect(screen.getByText('id')).toBeDefined();
    expect(screen.getByText('123')).toBeDefined();
    expect(screen.getByText('name')).toBeDefined();
    expect(screen.getByText('test')).toBeDefined();
  });

  it('应该处理包含加号的参数值', () => {
    const url = 'http://example.com?query=hello+world';
    render(<QueryParameters url={url} />);

    // URL 中的 + 应该被解码为空格
    expect(screen.getByText('query')).toBeDefined();
    expect(screen.getByText('hello world')).toBeDefined();
  });

  it('应该处理包含百分号编码的特殊字符', () => {
    const url = 'http://example.com?email=test%40example.com&path=%2Fapi%2Fv1';
    render(<QueryParameters url={url} />);

    // 检查特殊字符正确解码
    expect(screen.getByText('email')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
    expect(screen.getByText('path')).toBeDefined();
    expect(screen.getByText('/api/v1')).toBeDefined();
  });

  it('应该处理空键名的参数', () => {
    const url = 'http://example.com?=value&key=test';
    render(<QueryParameters url={url} />);

    // 空键名应该显示为 (empty)
    const emptyKeys = screen.getAllByText('(empty)');
    expect(emptyKeys.length).toBeGreaterThan(0);
    expect(screen.getByText('value')).toBeDefined();
    expect(screen.getByText('key')).toBeDefined();
    expect(screen.getByText('test')).toBeDefined();
  });
});
