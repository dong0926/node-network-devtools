/**
 * URL 解析工具函数单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  parseQueryParams,
  hasQueryParams,
  paramsToObject,
  paramsToMap,
} from './url-parser';

describe('parseQueryParams', () => {
  it('应该解析简单的查询参数', () => {
    const result = parseQueryParams('http://example.com?foo=bar&baz=qux');
    expect(result).toEqual([
      { key: 'foo', value: 'bar', decoded: true },
      { key: 'baz', value: 'qux', decoded: true },
    ]);
  });

  it('应该处理 URL 编码的参数', () => {
    const result = parseQueryParams('http://example.com?name=%E5%BC%A0%E4%B8%89');
    expect(result).toEqual([
      { key: 'name', value: '张三', decoded: true },
    ]);
  });

  it('应该处理空格编码（%20 和 +）', () => {
    const result1 = parseQueryParams('http://example.com?text=hello%20world');
    expect(result1[0].value).toBe('hello world');

    const result2 = parseQueryParams('http://example.com?text=hello+world');
    expect(result2[0].value).toBe('hello world');
  });

  it('应该处理特殊字符', () => {
    const result = parseQueryParams('http://example.com?special=%21%40%23%24%25');
    expect(result[0].value).toBe('!@#$%');
  });

  it('应该处理重复的参数名', () => {
    const result = parseQueryParams('http://example.com?tag=a&tag=b&tag=c');
    expect(result).toEqual([
      { key: 'tag', value: 'a', decoded: true },
      { key: 'tag', value: 'b', decoded: true },
      { key: 'tag', value: 'c', decoded: true },
    ]);
  });

  it('应该处理空值参数', () => {
    const result = parseQueryParams('http://example.com?empty=&key=value');
    expect(result).toEqual([
      { key: 'empty', value: '', decoded: true },
      { key: 'key', value: 'value', decoded: true },
    ]);
  });

  it('应该处理只有键没有值的参数', () => {
    const result = parseQueryParams('http://example.com?flag&key=value');
    expect(result).toEqual([
      { key: 'flag', value: '', decoded: true },
      { key: 'key', value: 'value', decoded: true },
    ]);
  });

  it('应该处理没有查询参数的 URL', () => {
    const result = parseQueryParams('http://example.com');
    expect(result).toEqual([]);
  });

  it('应该处理只有问号但没有参数的 URL', () => {
    const result = parseQueryParams('http://example.com?');
    expect(result).toEqual([]);
  });

  it('应该处理无效的 URL', () => {
    const result = parseQueryParams('not-a-valid-url');
    expect(result).toEqual([]);
  });

  it('应该处理包含 hash 的 URL', () => {
    const result = parseQueryParams('http://example.com?foo=bar#section');
    expect(result).toEqual([
      { key: 'foo', value: 'bar', decoded: true },
    ]);
  });

  it('应该处理包含端口的 URL', () => {
    const result = parseQueryParams('http://example.com:8080?foo=bar');
    expect(result).toEqual([
      { key: 'foo', value: 'bar', decoded: true },
    ]);
  });

  it('应该处理包含路径的 URL', () => {
    const result = parseQueryParams('http://example.com/api/users?id=123');
    expect(result).toEqual([
      { key: 'id', value: '123', decoded: true },
    ]);
  });

  it('应该处理包含等号的参数值', () => {
    const result = parseQueryParams('http://example.com?equation=a%3Db');
    expect(result[0].value).toBe('a=b');
  });

  it('应该处理包含 & 符号的参数值', () => {
    const result = parseQueryParams('http://example.com?text=a%26b');
    expect(result[0].value).toBe('a&b');
  });
});

describe('hasQueryParams', () => {
  it('应该检测到存在查询参数', () => {
    expect(hasQueryParams('http://example.com?foo=bar')).toBe(true);
  });

  it('应该检测到不存在查询参数', () => {
    expect(hasQueryParams('http://example.com')).toBe(false);
  });

  it('应该处理只有问号但没有参数的情况', () => {
    expect(hasQueryParams('http://example.com?')).toBe(false);
  });

  it('应该处理无效的 URL', () => {
    expect(hasQueryParams('not-a-valid-url')).toBe(false);
  });

  it('应该处理空字符串', () => {
    expect(hasQueryParams('')).toBe(false);
  });
});

describe('paramsToObject', () => {
  it('应该将参数数组转换为对象', () => {
    const params = parseQueryParams('http://example.com?foo=bar&baz=qux');
    const obj = paramsToObject(params);
    expect(obj).toEqual({ foo: 'bar', baz: 'qux' });
  });

  it('应该处理重复键（后面的值覆盖前面的）', () => {
    const params = parseQueryParams('http://example.com?key=first&key=second');
    const obj = paramsToObject(params);
    expect(obj).toEqual({ key: 'second' });
  });

  it('应该处理空数组', () => {
    const obj = paramsToObject([]);
    expect(obj).toEqual({});
  });

  it('应该处理空值参数', () => {
    const params = parseQueryParams('http://example.com?empty=');
    const obj = paramsToObject(params);
    expect(obj).toEqual({ empty: '' });
  });
});

describe('paramsToMap', () => {
  it('应该将参数数组转换为 Map', () => {
    const params = parseQueryParams('http://example.com?foo=bar&baz=qux');
    const map = paramsToMap(params);
    expect(map.get('foo')).toBe('bar');
    expect(map.get('baz')).toBe('qux');
  });

  it('应该处理重复键（转换为数组）', () => {
    const params = parseQueryParams('http://example.com?tag=a&tag=b&tag=c');
    const map = paramsToMap(params);
    expect(map.get('tag')).toEqual(['a', 'b', 'c']);
  });

  it('应该处理混合的单值和多值参数', () => {
    const params = parseQueryParams('http://example.com?tag=a&tag=b&name=test');
    const map = paramsToMap(params);
    expect(map.get('tag')).toEqual(['a', 'b']);
    expect(map.get('name')).toBe('test');
  });

  it('应该处理空数组', () => {
    const map = paramsToMap([]);
    expect(map.size).toBe(0);
  });

  it('应该保持参数顺序', () => {
    const params = parseQueryParams('http://example.com?a=1&b=2&c=3');
    const map = paramsToMap(params);
    const keys = Array.from(map.keys());
    expect(keys).toEqual(['a', 'b', 'c']);
  });
});
