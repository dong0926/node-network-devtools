/**
 * JSON 工具函数单元测试
 */

import { describe, it, expect } from 'vitest';
import { tryParseJSON, getNodeType, getNodeSize } from './json-utils';

describe('tryParseJSON', () => {
  it('应该成功解析有效的 JSON 字符串', () => {
    const result = tryParseJSON('{"name": "test"}');
    expect(result).toEqual({ name: 'test' });
  });

  it('应该解析 JSON 数组', () => {
    const result = tryParseJSON('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('应该解析 JSON 字符串值', () => {
    const result = tryParseJSON('"hello"');
    expect(result).toBe('hello');
  });

  it('应该解析 JSON 数字值', () => {
    const result = tryParseJSON('123');
    expect(result).toBe(123);
  });

  it('应该解析 JSON 布尔值', () => {
    const result = tryParseJSON('true');
    expect(result).toBe(true);
  });

  it('应该解析 JSON null 值', () => {
    const result = tryParseJSON('null');
    expect(result).toBe(null);
  });

  it('应该解析嵌套的 JSON 对象', () => {
    const result = tryParseJSON('{"user": {"name": "test", "age": 25}}');
    expect(result).toEqual({ user: { name: 'test', age: 25 } });
  });

  it('应该在解析无效 JSON 时返回 null', () => {
    const result = tryParseJSON('invalid json');
    expect(result).toBe(null);
  });

  it('应该在解析不完整的 JSON 时返回 null', () => {
    const result = tryParseJSON('{"name": ');
    expect(result).toBe(null);
  });

  it('应该在解析空字符串时返回 null', () => {
    const result = tryParseJSON('');
    expect(result).toBe(null);
  });

  it('应该处理包含特殊字符的 JSON', () => {
    const result = tryParseJSON('{"text": "Hello\\nWorld\\t!"}');
    expect(result).toEqual({ text: 'Hello\nWorld\t!' });
  });
});

describe('getNodeType', () => {
  it('应该识别对象类型', () => {
    expect(getNodeType({})).toBe('object');
    expect(getNodeType({ name: 'test' })).toBe('object');
  });

  it('应该识别数组类型', () => {
    expect(getNodeType([])).toBe('array');
    expect(getNodeType([1, 2, 3])).toBe('array');
  });

  it('应该识别字符串类型', () => {
    expect(getNodeType('')).toBe('string');
    expect(getNodeType('hello')).toBe('string');
  });

  it('应该识别数字类型', () => {
    expect(getNodeType(0)).toBe('number');
    expect(getNodeType(123)).toBe('number');
    expect(getNodeType(-456)).toBe('number');
    expect(getNodeType(3.14)).toBe('number');
  });

  it('应该识别布尔类型', () => {
    expect(getNodeType(true)).toBe('boolean');
    expect(getNodeType(false)).toBe('boolean');
  });

  it('应该识别 null 类型', () => {
    expect(getNodeType(null)).toBe('null');
  });

  it('应该识别 undefined 类型', () => {
    expect(getNodeType(undefined)).toBe('undefined');
  });

  it('应该正确区分数组和对象', () => {
    expect(getNodeType([])).toBe('array');
    expect(getNodeType({})).toBe('object');
    expect(getNodeType([1, 2])).toBe('array');
    expect(getNodeType({ a: 1 })).toBe('object');
  });

  it('应该处理特殊数字值', () => {
    expect(getNodeType(NaN)).toBe('number');
    expect(getNodeType(Infinity)).toBe('number');
    expect(getNodeType(-Infinity)).toBe('number');
  });
});

describe('getNodeSize', () => {
  it('应该返回对象的属性数量', () => {
    expect(getNodeSize({})).toBe(0);
    expect(getNodeSize({ a: 1 })).toBe(1);
    expect(getNodeSize({ a: 1, b: 2, c: 3 })).toBe(3);
  });

  it('应该返回数组的元素数量', () => {
    expect(getNodeSize([])).toBe(0);
    expect(getNodeSize([1])).toBe(1);
    expect(getNodeSize([1, 2, 3, 4, 5])).toBe(5);
  });

  it('应该对字符串返回 0', () => {
    expect(getNodeSize('')).toBe(0);
    expect(getNodeSize('hello')).toBe(0);
  });

  it('应该对数字返回 0', () => {
    expect(getNodeSize(0)).toBe(0);
    expect(getNodeSize(123)).toBe(0);
  });

  it('应该对布尔值返回 0', () => {
    expect(getNodeSize(true)).toBe(0);
    expect(getNodeSize(false)).toBe(0);
  });

  it('应该对 null 返回 0', () => {
    expect(getNodeSize(null)).toBe(0);
  });

  it('应该对 undefined 返回 0', () => {
    expect(getNodeSize(undefined)).toBe(0);
  });

  it('应该处理嵌套对象', () => {
    const nested = {
      a: { b: { c: 1 } },
      d: [1, 2, 3],
      e: 'test'
    };
    expect(getNodeSize(nested)).toBe(3);
  });

  it('应该处理嵌套数组', () => {
    const nested = [[1, 2], [3, 4], [5, 6]];
    expect(getNodeSize(nested)).toBe(3);
  });

  it('应该只计算自有属性', () => {
    const obj = Object.create({ inherited: 'value' });
    obj.own = 'value';
    expect(getNodeSize(obj)).toBe(1);
  });
});
