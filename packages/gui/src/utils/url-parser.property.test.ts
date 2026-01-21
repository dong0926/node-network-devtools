/**
 * URL 解析工具函数属性测试
 * 
 * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
 * 
 * *For any* 包含查询参数的 URL，解析后的参数列表应该包含 URL 中的所有参数，
 * 且每个参数的键值对应该正确
 * 
 * **Validates: Requirements 2.2**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { parseQueryParams, paramsToObject, paramsToMap } from './url-parser';

/**
 * 生成有效的查询参数键名
 * 使用字母、数字、下划线和连字符
 */
const queryParamKeyArbitrary = fc.stringMatching(/^[a-zA-Z0-9_-]+$/);

/**
 * 生成有效的查询参数值
 * 可以包含各种字符，但避免控制字符
 */
const queryParamValueArbitrary = fc.string().filter(s => {
  // 过滤掉控制字符和某些特殊字符
  return !/[\x00-\x1F\x7F]/.test(s);
});

/**
 * 生成查询参数字典
 */
const queryParamsDictArbitrary = fc.dictionary(
  queryParamKeyArbitrary,
  queryParamValueArbitrary,
  { minKeys: 1, maxKeys: 10 }
);

/**
 * 构建带查询参数的 URL
 */
function buildURLWithParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

/**
 * 生成有效的基础 URL
 */
const baseUrlArbitrary = fc.oneof(
  fc.constant('http://example.com'),
  fc.constant('https://example.com'),
  fc.constant('http://localhost:8080'),
  fc.constant('https://api.example.com/v1/users'),
  fc.constant('http://example.com:3000/api/data')
);

describe('URL 解析工具属性测试', () => {
  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 包含查询参数的 URL，解析后的参数数量应该等于原始参数数量
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4a: 解析后的参数数量应该等于原始参数数量', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamsDictArbitrary,
        (baseUrl, params) => {
          const url = buildURLWithParams(baseUrl, params);
          const parsed = parseQueryParams(url);
          
          const expectedCount = Object.keys(params).length;
          const actualCount = parsed.length;
          
          if (actualCount !== expectedCount) {
            console.log(`\n❌ 参数数量不匹配`);
            console.log(`   URL: ${url}`);
            console.log(`   期望: ${expectedCount} 个参数`);
            console.log(`   实际: ${actualCount} 个参数`);
            console.log(`   原始参数:`, params);
            console.log(`   解析结果:`, parsed);
          }
          
          return actualCount === expectedCount;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 包含查询参数的 URL，解析后的每个参数键应该存在于原始参数中
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4b: 解析后的所有参数键都应该存在于原始参数中', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamsDictArbitrary,
        (baseUrl, params) => {
          const url = buildURLWithParams(baseUrl, params);
          const parsed = parseQueryParams(url);
          const originalKeys = Object.keys(params);
          
          const allKeysValid = parsed.every(param => originalKeys.includes(param.key));
          
          if (!allKeysValid) {
            const invalidKeys = parsed
              .filter(param => !originalKeys.includes(param.key))
              .map(param => param.key);
            
            console.log(`\n❌ 发现无效的参数键`);
            console.log(`   URL: ${url}`);
            console.log(`   原始键: ${originalKeys.join(', ')}`);
            console.log(`   无效键: ${invalidKeys.join(', ')}`);
          }
          
          return allKeysValid;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 包含查询参数的 URL，解析后的每个参数值应该等于原始参数值
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4c: 解析后的参数值应该等于原始参数值', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamsDictArbitrary,
        (baseUrl, params) => {
          const url = buildURLWithParams(baseUrl, params);
          const parsed = parseQueryParams(url);
          const parsedObj = paramsToObject(parsed);
          
          const allValuesMatch = Object.entries(params).every(([key, value]) => {
            return parsedObj[key] === value;
          });
          
          if (!allValuesMatch) {
            const mismatchedKeys = Object.entries(params)
              .filter(([key, value]) => parsedObj[key] !== value)
              .map(([key]) => key);
            
            console.log(`\n❌ 参数值不匹配`);
            console.log(`   URL: ${url}`);
            console.log(`   不匹配的键: ${mismatchedKeys.join(', ')}`);
            console.log(`   原始参数:`, params);
            console.log(`   解析结果:`, parsedObj);
          }
          
          return allValuesMatch;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 包含重复参数的 URL，解析后应该保留所有值
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4d: 重复参数应该被正确解析并保留所有值', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamKeyArbitrary,
        fc.array(queryParamValueArbitrary, { minLength: 2, maxLength: 5 }),
        (baseUrl, key, values) => {
          // 构建包含重复参数的 URL
          const url = new URL(baseUrl);
          values.forEach(value => {
            url.searchParams.append(key, value);
          });
          
          const parsed = parseQueryParams(url.toString());
          const parsedMap = paramsToMap(parsed);
          const parsedValues = parsedMap.get(key);
          
          // 应该是数组且包含所有值
          const isArray = Array.isArray(parsedValues);
          const hasAllValues = isArray && 
            parsedValues.length === values.length &&
            values.every(v => parsedValues.includes(v));
          
          if (!hasAllValues) {
            console.log(`\n❌ 重复参数解析不正确`);
            console.log(`   URL: ${url.toString()}`);
            console.log(`   参数键: ${key}`);
            console.log(`   期望值: ${JSON.stringify(values)}`);
            console.log(`   实际值: ${JSON.stringify(parsedValues)}`);
          }
          
          return hasAllValues;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 包含特殊字符的参数值，解析后应该正确解码
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4e: 特殊字符应该被正确编码和解码', () => {
    // 测试常见的特殊字符
    const specialCharsArbitrary = fc.constantFrom(
      'hello world',      // 空格
      'a+b',              // 加号
      'a&b',              // &符号
      'a=b',              // 等号
      'a/b',              // 斜杠
      'a?b',              // 问号
      'a#b',              // 井号
      '张三',             // 中文
      'café',             // 重音字符
      '!@#$%',            // 特殊符号
      'a\nb',             // 换行符
      'a\tb',             // 制表符
    );

    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamKeyArbitrary,
        specialCharsArbitrary,
        (baseUrl, key, value) => {
          const url = new URL(baseUrl);
          url.searchParams.append(key, value);
          
          const parsed = parseQueryParams(url.toString());
          const parsedObj = paramsToObject(parsed);
          
          const matches = parsedObj[key] === value;
          
          if (!matches) {
            console.log(`\n❌ 特殊字符解码不正确`);
            console.log(`   URL: ${url.toString()}`);
            console.log(`   参数键: ${key}`);
            console.log(`   原始值: "${value}"`);
            console.log(`   解析值: "${parsedObj[key]}"`);
          }
          
          return matches;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 空值参数，解析后应该保留空字符串
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4f: 空值参数应该被解析为空字符串', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        fc.array(queryParamKeyArbitrary, { minLength: 1, maxLength: 5 }),
        (baseUrl, keys) => {
          // 构建包含空值参数的 URL
          const url = new URL(baseUrl);
          keys.forEach(key => {
            url.searchParams.append(key, '');
          });
          
          const parsed = parseQueryParams(url.toString());
          const parsedObj = paramsToObject(parsed);
          
          const allEmpty = keys.every(key => parsedObj[key] === '');
          
          if (!allEmpty) {
            const nonEmptyKeys = keys.filter(key => parsedObj[key] !== '');
            console.log(`\n❌ 空值参数解析不正确`);
            console.log(`   URL: ${url.toString()}`);
            console.log(`   非空的键: ${nonEmptyKeys.join(', ')}`);
            console.log(`   解析结果:`, parsedObj);
          }
          
          return allEmpty;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 无效的 URL，解析应该返回空数组而不是抛出错误
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4g: 无效 URL 应该返回空数组', () => {
    const invalidUrlArbitrary = fc.oneof(
      fc.constant(''),
      fc.constant('not-a-url'),
      fc.constant('ftp://invalid'),
      fc.constant('javascript:alert(1)'),
      fc.constant('data:text/plain,hello'),
      fc.string().filter(s => {
        try {
          new URL(s);
          return false;
        } catch {
          return true;
        }
      })
    );

    fc.assert(
      fc.property(
        invalidUrlArbitrary,
        (invalidUrl) => {
          let result: ReturnType<typeof parseQueryParams> = [];
          let threwError = false;
          
          try {
            result = parseQueryParams(invalidUrl);
          } catch (error) {
            threwError = true;
            console.log(`\n❌ 解析无效 URL 时抛出错误`);
            console.log(`   URL: "${invalidUrl}"`);
            console.log(`   错误:`, error);
          }
          
          if (!threwError && result.length !== 0) {
            console.log(`\n⚠️  无效 URL 返回了非空结果`);
            console.log(`   URL: "${invalidUrl}"`);
            console.log(`   结果:`, result);
          }
          
          return !threwError && result.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* URL，解析结果应该是幂等的（多次解析得到相同结果）
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4h: 解析操作应该是幂等的', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamsDictArbitrary,
        (baseUrl, params) => {
          const url = buildURLWithParams(baseUrl, params);
          
          const result1 = parseQueryParams(url);
          const result2 = parseQueryParams(url);
          
          const areEqual = JSON.stringify(result1) === JSON.stringify(result2);
          
          if (!areEqual) {
            console.log(`\n❌ 解析结果不一致`);
            console.log(`   URL: ${url}`);
            console.log(`   第一次解析:`, result1);
            console.log(`   第二次解析:`, result2);
          }
          
          return areEqual;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* URL，所有解析的参数都应该标记为已解码
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4i: 所有解析的参数都应该标记为已解码', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamsDictArbitrary,
        (baseUrl, params) => {
          const url = buildURLWithParams(baseUrl, params);
          const parsed = parseQueryParams(url);
          
          const allDecoded = parsed.every(param => param.decoded === true);
          
          if (!allDecoded) {
            const notDecoded = parsed.filter(param => !param.decoded);
            console.log(`\n❌ 存在未标记为已解码的参数`);
            console.log(`   URL: ${url}`);
            console.log(`   未解码的参数:`, notDecoded);
          }
          
          return allDecoded;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: gui-devtools-enhancements, Property 4: 查询参数解析完整性
   * 
   * *For any* 包含 hash 的 URL，hash 不应该影响查询参数解析
   * 
   * **Validates: Requirements 2.2**
   */
  it('Property 4j: URL hash 不应该影响查询参数解析', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        queryParamsDictArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (baseUrl, params, hash) => {
          const urlWithoutHash = buildURLWithParams(baseUrl, params);
          const urlWithHash = urlWithoutHash + '#' + hash;
          
          const parsedWithoutHash = parseQueryParams(urlWithoutHash);
          const parsedWithHash = parseQueryParams(urlWithHash);
          
          const areEqual = JSON.stringify(parsedWithoutHash) === JSON.stringify(parsedWithHash);
          
          if (!areEqual) {
            console.log(`\n❌ Hash 影响了查询参数解析`);
            console.log(`   不带 hash: ${urlWithoutHash}`);
            console.log(`   带 hash: ${urlWithHash}`);
            console.log(`   不带 hash 结果:`, parsedWithoutHash);
            console.log(`   带 hash 结果:`, parsedWithHash);
          }
          
          return areEqual;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});
