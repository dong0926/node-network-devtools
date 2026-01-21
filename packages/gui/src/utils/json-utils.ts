/**
 * JSON 工具函数
 * 
 * 提供安全的 JSON 解析和节点信息获取功能
 */

/**
 * JSON 节点类型
 */
export type JSONNodeType = 
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined';

/**
 * 安全解析 JSON 字符串
 * 
 * @param text - 要解析的 JSON 字符串
 * @returns 解析后的对象，如果解析失败则返回 null
 * 
 * @example
 * ```typescript
 * const result = tryParseJSON('{"name": "test"}');
 * // result: { name: "test" }
 * 
 * const invalid = tryParseJSON('invalid json');
 * // invalid: null
 * ```
 */
export function tryParseJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * 获取 JSON 节点的类型
 * 
 * @param value - 要检查的值
 * @returns 节点类型
 * 
 * @example
 * ```typescript
 * getNodeType({}) // 'object'
 * getNodeType([]) // 'array'
 * getNodeType('text') // 'string'
 * getNodeType(123) // 'number'
 * getNodeType(true) // 'boolean'
 * getNodeType(null) // 'null'
 * getNodeType(undefined) // 'undefined'
 * ```
 */
export function getNodeType(value: unknown): JSONNodeType {
  if (value === null) {
    return 'null';
  }
  
  if (value === undefined) {
    return 'undefined';
  }
  
  if (Array.isArray(value)) {
    return 'array';
  }
  
  const type = typeof value;
  
  if (type === 'object') {
    return 'object';
  }
  
  if (type === 'string') {
    return 'string';
  }
  
  if (type === 'number') {
    return 'number';
  }
  
  if (type === 'boolean') {
    return 'boolean';
  }
  
  // 默认返回 undefined（不应该到达这里）
  return 'undefined';
}

/**
 * 获取对象或数组的大小（属性数量或元素数量）
 * 
 * @param value - 要检查的值
 * @returns 对象的属性数量或数组的元素数量，如果不是对象或数组则返回 0
 * 
 * @example
 * ```typescript
 * getNodeSize({ a: 1, b: 2, c: 3 }) // 3
 * getNodeSize([1, 2, 3, 4, 5]) // 5
 * getNodeSize('string') // 0
 * getNodeSize(123) // 0
 * getNodeSize(null) // 0
 * ```
 */
export function getNodeSize(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).length;
  }
  
  return 0;
}
