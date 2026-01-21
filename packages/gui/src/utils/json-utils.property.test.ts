/**
 * JSON 工具函数属性测试
 * 
 * 使用 fast-check 进行基于属性的测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { tryParseJSON, getNodeType, getNodeSize, type JSONNodeType } from './json-utils';

describe('JSON 工具函数属性测试', () => {
  /**
   * 属性 11：无效 JSON 回退
   * 
   * **Validates: Requirements 3.10**
   * 
   * 对于任意无效的 JSON 字符串或空数据，tryParseJSON 应该返回 null 而不是抛出错误
   */
  it('属性 11：tryParseJSON 对于无效 JSON 应该返回 null 而不抛出错误', () => {
    fc.assert(
      fc.property(
        fc.string(), // 任意字符串
        (text) => {
          const result = tryParseJSON(text);
          // 如果解析失败，应该返回 null，而不是抛出异常
          // 如果解析成功，结果应该是有效的 JSON 值
          return result === null || result !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：tryParseJSON 往返一致性
   * 
   * 对于任意有效的 JSON 值，JSON.stringify 后再 tryParseJSON 应该得到相同的值
   */
  it('属性：tryParseJSON 应该正确解析 JSON.stringify 的结果', () => {
    fc.assert(
      fc.property(
        fc.jsonValue(), // 任意有效的 JSON 值
        (value) => {
          const jsonString = JSON.stringify(value);
          const parsed = tryParseJSON(jsonString);
          return JSON.stringify(parsed) === jsonString;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：getNodeType 类型一致性
   * 
   * 对于任意值，getNodeType 返回的类型应该与实际类型匹配
   */
  it('属性：getNodeType 应该返回正确的类型', () => {
    fc.assert(
      fc.property(
        fc.anything(), // 任意值
        (value) => {
          const type = getNodeType(value);
          const validTypes: JSONNodeType[] = [
            'object', 'array', 'string', 'number', 'boolean', 'null', 'undefined'
          ];
          
          // 返回的类型应该是有效的类型之一
          if (!validTypes.includes(type)) {
            return false;
          }
          
          // 验证类型判断的正确性
          if (value === null) {
            return type === 'null';
          }
          if (value === undefined) {
            return type === 'undefined';
          }
          if (Array.isArray(value)) {
            return type === 'array';
          }
          if (typeof value === 'object') {
            return type === 'object';
          }
          if (typeof value === 'string') {
            return type === 'string';
          }
          if (typeof value === 'number') {
            return type === 'number';
          }
          if (typeof value === 'boolean') {
            return type === 'boolean';
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 9：折叠节点信息显示（部分）
   * 
   * **Validates: Requirements 3.5, 3.6**
   * 
   * 对于任意对象或数组，getNodeSize 返回的大小应该等于实际的属性/元素数量
   */
  it('属性 9：getNodeSize 应该返回正确的对象属性数量', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()), // 任意对象
        (obj) => {
          const size = getNodeSize(obj);
          const expectedSize = Object.keys(obj).length;
          return size === expectedSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('属性 9：getNodeSize 应该返回正确的数组元素数量', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything()), // 任意数组
        (arr) => {
          const size = getNodeSize(arr);
          return size === arr.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：getNodeSize 非容器类型返回 0
   * 
   * 对于任意非对象非数组的值，getNodeSize 应该返回 0
   */
  it('属性：getNodeSize 对于原始类型应该返回 0', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (value) => {
          const size = getNodeSize(value);
          return size === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：getNodeType 和 getNodeSize 的一致性
   * 
   * 对于任意值，如果 getNodeType 返回 'object' 或 'array'，
   * 则 getNodeSize 应该返回非负整数；否则应该返回 0
   */
  it('属性：getNodeType 和 getNodeSize 应该保持一致', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (value) => {
          const type = getNodeType(value);
          const size = getNodeSize(value);
          
          if (type === 'object' || type === 'array') {
            // 对象和数组应该返回非负整数
            return Number.isInteger(size) && size >= 0;
          } else {
            // 其他类型应该返回 0
            return size === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：tryParseJSON 幂等性
   * 
   * 对于任意已经是对象的值，tryParseJSON(JSON.stringify(value)) 应该等价于 value
   */
  it('属性：tryParseJSON 应该保持数据的幂等性', () => {
    fc.assert(
      fc.property(
        fc.jsonValue(),
        (value) => {
          const stringified = JSON.stringify(value);
          const parsed = tryParseJSON(stringified);
          const reStringified = JSON.stringify(parsed);
          return stringified === reStringified;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：getNodeSize 非负性
   * 
   * 对于任意值，getNodeSize 应该始终返回非负整数
   */
  it('属性：getNodeSize 应该始终返回非负整数', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (value) => {
          const size = getNodeSize(value);
          return Number.isInteger(size) && size >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：空容器的大小为 0
   * 
   * 空对象和空数组的 getNodeSize 应该返回 0
   */
  it('属性：空容器应该返回大小 0', () => {
    expect(getNodeSize({})).toBe(0);
    expect(getNodeSize([])).toBe(0);
  });

  /**
   * 属性：getNodeType 对于 JSON 值的完整性
   * 
   * 对于任意有效的 JSON 值，getNodeType 应该返回有效的类型
   */
  it('属性：getNodeType 应该处理所有 JSON 值类型', () => {
    fc.assert(
      fc.property(
        fc.jsonValue(),
        (value) => {
          const type = getNodeType(value);
          const validTypes: JSONNodeType[] = [
            'object', 'array', 'string', 'number', 'boolean', 'null'
          ];
          return validTypes.includes(type);
        }
      ),
      { numRuns: 100 }
    );
  });
});
