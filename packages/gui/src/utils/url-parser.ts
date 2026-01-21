/**
 * URL 解析工具函数
 * 
 * 提供 URL 查询参数解析功能
 */

/**
 * 查询参数接口
 */
export interface QueryParam {
  /** 参数名 */
  key: string;
  /** 参数值 */
  value: string;
  /** 是否已解码 */
  decoded: boolean;
}

/**
 * 解析 URL 查询参数
 * 
 * 将 URL 中的查询参数解析为键值对数组。
 * 处理特殊字符、URL 编码和重复参数。
 * 
 * @param url - 完整的 URL 字符串
 * @returns 查询参数数组，如果没有参数或 URL 无效则返回空数组
 * 
 * @example
 * ```typescript
 * parseQueryParams('http://example.com?foo=bar&baz=qux')
 * // 返回: [{ key: 'foo', value: 'bar', decoded: true }, { key: 'baz', value: 'qux', decoded: true }]
 * 
 * parseQueryParams('http://example.com?name=%E5%BC%A0%E4%B8%89')
 * // 返回: [{ key: 'name', value: '张三', decoded: true }]
 * 
 * parseQueryParams('http://example.com?tag=a&tag=b')
 * // 返回: [{ key: 'tag', value: 'a', decoded: true }, { key: 'tag', value: 'b', decoded: true }]
 * ```
 */
export function parseQueryParams(url: string): QueryParam[] {
  try {
    // 使用 URL API 解析 URL
    const urlObj = new URL(url);
    const params: QueryParam[] = [];
    
    // URLSearchParams 会自动处理 URL 解码
    urlObj.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        decoded: true,
      });
    });
    
    return params;
  } catch (error) {
    // URL 无效时返回空数组
    return [];
  }
}

/**
 * 检查 URL 是否包含查询参数
 * 
 * @param url - 完整的 URL 字符串
 * @returns 是否包含查询参数
 * 
 * @example
 * ```typescript
 * hasQueryParams('http://example.com?foo=bar') // true
 * hasQueryParams('http://example.com') // false
 * hasQueryParams('invalid-url') // false
 * ```
 */
export function hasQueryParams(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.toString().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 将查询参数数组转换为对象
 * 
 * 注意：如果有重复的键，后面的值会覆盖前面的值。
 * 如果需要保留所有值，请使用 parseQueryParams 返回的数组。
 * 
 * 安全性：使用 Object.create(null) 创建无原型对象，防止原型污染
 * 
 * @param params - 查询参数数组
 * @returns 查询参数对象
 * 
 * @example
 * ```typescript
 * const params = parseQueryParams('http://example.com?foo=bar&baz=qux');
 * paramsToObject(params) // { foo: 'bar', baz: 'qux' }
 * ```
 */
export function paramsToObject(params: QueryParam[]): Record<string, string> {
  // 使用 Object.create(null) 创建无原型对象，防止原型污染
  const obj = Object.create(null) as Record<string, string>;
  
  params.forEach(param => {
    obj[param.key] = param.value;
  });
  
  return obj;
}

/**
 * 将查询参数数组转换为 Map（支持重复键）
 * 
 * 对于重复的键，值会被存储为数组。
 * 
 * @param params - 查询参数数组
 * @returns 查询参数 Map，值可能是字符串或字符串数组
 * 
 * @example
 * ```typescript
 * const params = parseQueryParams('http://example.com?tag=a&tag=b&name=test');
 * paramsToMap(params)
 * // Map { 'tag' => ['a', 'b'], 'name' => 'test' }
 * ```
 */
export function paramsToMap(params: QueryParam[]): Map<string, string | string[]> {
  const map = new Map<string, string | string[]>();
  
  params.forEach(param => {
    const existing = map.get(param.key);
    
    if (existing === undefined) {
      // 第一次出现该键
      map.set(param.key, param.value);
    } else if (Array.isArray(existing)) {
      // 已经是数组，添加新值
      existing.push(param.value);
    } else {
      // 第二次出现该键，转换为数组
      map.set(param.key, [existing, param.value]);
    }
  });
  
  return map;
}
