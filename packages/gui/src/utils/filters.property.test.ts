/**
 * 过滤功能属性测试
 * 
 * **Property 8: 过滤功能正确性**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 * 
 * *For any* combination of filter criteria (URL search, method, status code, type),
 * only requests matching ALL criteria SHALL be displayed.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UIRequest } from '../hooks/useRequests';
import {
  matchUrlSearch,
  matchMethod,
  matchStatusCode,
  matchStatusCodeGroup,
  matchType,
  matchAllCriteria,
  filterRequests,
  type FilterCriteria,
} from './filters';

// ============================================================================
// 生成器（Generators）
// ============================================================================

/**
 * 生成有效的请求 ID
 */
const requestIdArb = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

/**
 * 生成有效的 URL
 */
const urlArb = fc.webUrl();

/**
 * 生成 HTTP 方法
 */
const httpMethodArb = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS');

/**
 * 生成请求类型
 */
const requestTypeArb = fc.constantFrom('fetch', 'script', 'stylesheet', 'json', 'document', 'image', 'font', 'other');

/**
 * 生成请求状态
 */
const requestStatusArb = fc.constantFrom('pending', 'complete', 'error') as fc.Arbitrary<'pending' | 'complete' | 'error'>;

/**
 * 生成 HTTP 状态码
 */
const statusCodeArb = fc.oneof(
  // 2xx 成功
  fc.integer({ min: 200, max: 299 }),
  // 3xx 重定向
  fc.integer({ min: 300, max: 399 }),
  // 4xx 客户端错误
  fc.integer({ min: 400, max: 499 }),
  // 5xx 服务器错误
  fc.integer({ min: 500, max: 599 })
);

/**
 * 生成状态码分组
 */
const statusCodeGroupArb = fc.constantFrom('2xx', '3xx', '4xx', '5xx');

/**
 * 生成 UIRequest 对象
 */
const uiRequestArb: fc.Arbitrary<UIRequest> = fc.record({
  id: requestIdArb,
  url: urlArb,
  method: httpMethodArb,
  status: requestStatusArb,
  statusCode: fc.option(statusCodeArb, { nil: undefined }),
  statusText: fc.option(fc.string(), { nil: undefined }),
  type: requestTypeArb,
  size: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: undefined }),
  time: fc.option(fc.integer({ min: 0, max: 60000 }), { nil: undefined }),
  startTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  endTime: fc.option(fc.integer({ min: 1000000000000, max: 2000000000000 }), { nil: undefined }),
  requestHeaders: fc.constant({} as Record<string, string>),
  responseHeaders: fc.option(fc.constant({} as Record<string, string>), { nil: undefined }),
  requestBody: fc.option(fc.string(), { nil: undefined }),
  responseBody: fc.option(fc.string(), { nil: undefined }),
  timing: fc.constant(undefined),
  error: fc.option(
    fc.record({
      code: fc.string(),
      message: fc.string(),
    }),
    { nil: undefined }
  ),
  traceId: fc.option(fc.string(), { nil: undefined }),
  stackTrace: fc.option(fc.string(), { nil: undefined }),
});

/**
 * 生成已完成的请求（带有状态码）
 */
const completedRequestArb: fc.Arbitrary<UIRequest> = fc.record({
  id: requestIdArb,
  url: urlArb,
  method: httpMethodArb,
  status: fc.constant('complete' as const),
  statusCode: statusCodeArb,
  statusText: fc.option(fc.string(), { nil: undefined }),
  type: requestTypeArb,
  size: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: undefined }),
  time: fc.option(fc.integer({ min: 0, max: 60000 }), { nil: undefined }),
  startTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  endTime: fc.option(fc.integer({ min: 1000000000000, max: 2000000000000 }), { nil: undefined }),
  requestHeaders: fc.constant({} as Record<string, string>),
  responseHeaders: fc.option(fc.constant({} as Record<string, string>), { nil: undefined }),
  requestBody: fc.option(fc.string(), { nil: undefined }),
  responseBody: fc.option(fc.string(), { nil: undefined }),
  timing: fc.constant(undefined),
  error: fc.constant(undefined),
  traceId: fc.option(fc.string(), { nil: undefined }),
  stackTrace: fc.option(fc.string(), { nil: undefined }),
});

/**
 * 生成过滤条件
 */
const filterCriteriaArb: fc.Arbitrary<FilterCriteria> = fc.record({
  search: fc.string({ maxLength: 50 }),
  methods: fc.array(httpMethodArb, { maxLength: 4 }),
  statusCodes: fc.array(statusCodeGroupArb, { maxLength: 4 }),
  types: fc.array(requestTypeArb, { maxLength: 4 }),
});

// ============================================================================
// Property 8: 过滤功能正确性
// ============================================================================

describe('Property 8: 过滤功能正确性', () => {
  /**
   * **Validates: Requirements 5.1**
   * 
   * THE Request_Panel SHALL provide a search input that filters requests by URL
   */
  describe('URL 搜索过滤', () => {
    it('空搜索字符串应该匹配所有请求', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            expect(matchUrlSearch(request, '')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('URL 包含搜索字符串时应该匹配（不区分大小写）', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            // 从 URL 中提取一个子字符串作为搜索词
            const url = request.url;
            if (url.length > 0) {
              const startIndex = Math.floor(Math.random() * url.length);
              const endIndex = Math.min(startIndex + 5, url.length);
              const searchTerm = url.substring(startIndex, endIndex);
              
              // 搜索词应该匹配
              expect(matchUrlSearch(request, searchTerm)).toBe(true);
              // 大写搜索词也应该匹配
              expect(matchUrlSearch(request, searchTerm.toUpperCase())).toBe(true);
              // 小写搜索词也应该匹配
              expect(matchUrlSearch(request, searchTerm.toLowerCase())).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('URL 不包含搜索字符串时不应该匹配', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          fc.string({ minLength: 10, maxLength: 20 }).filter(s => !s.includes('http')),
          (request, randomString) => {
            // 使用一个不太可能出现在 URL 中的随机字符串
            const uniqueSearch = `__UNIQUE_${randomString}__`;
            if (!request.url.toLowerCase().includes(uniqueSearch.toLowerCase())) {
              expect(matchUrlSearch(request, uniqueSearch)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.2, 5.3**
   * 
   * THE Request_Panel SHALL provide filter buttons for request types (XHR, Fetch, All)
   * THE Request_Panel SHALL provide filter buttons for HTTP methods (GET, POST, PUT, DELETE, All)
   */
  describe('HTTP 方法过滤', () => {
    it('空方法数组应该匹配所有请求', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            expect(matchMethod(request, [])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('请求方法在过滤列表中时应该匹配', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            // 包含请求方法的过滤列表应该匹配
            expect(matchMethod(request, [request.method])).toBe(true);
            // 包含多个方法（包括请求方法）的列表也应该匹配
            expect(matchMethod(request, ['GET', 'POST', request.method])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('请求方法不在过滤列表中时不应该匹配', () => {
      fc.assert(
        fc.property(
          completedRequestArb,
          (request) => {
            // 创建一个不包含请求方法的过滤列表
            const allMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
            const otherMethods = allMethods.filter(m => m !== request.method);
            
            if (otherMethods.length > 0) {
              expect(matchMethod(request, otherMethods)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.4**
   * 
   * THE Request_Panel SHALL provide a filter for status codes (2xx, 3xx, 4xx, 5xx, All)
   */
  describe('状态码分组过滤', () => {
    it('状态码分组匹配应该正确', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 299 }),
          (statusCode) => {
            expect(matchStatusCodeGroup(statusCode, '2xx')).toBe(true);
            expect(matchStatusCodeGroup(statusCode, '3xx')).toBe(false);
            expect(matchStatusCodeGroup(statusCode, '4xx')).toBe(false);
            expect(matchStatusCodeGroup(statusCode, '5xx')).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('3xx 状态码应该匹配 3xx 分组', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 300, max: 399 }),
          (statusCode) => {
            expect(matchStatusCodeGroup(statusCode, '3xx')).toBe(true);
            expect(matchStatusCodeGroup(statusCode, '2xx')).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('4xx 状态码应该匹配 4xx 分组', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 499 }),
          (statusCode) => {
            expect(matchStatusCodeGroup(statusCode, '4xx')).toBe(true);
            expect(matchStatusCodeGroup(statusCode, '2xx')).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('5xx 状态码应该匹配 5xx 分组', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 599 }),
          (statusCode) => {
            expect(matchStatusCodeGroup(statusCode, '5xx')).toBe(true);
            expect(matchStatusCodeGroup(statusCode, '2xx')).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('undefined 状态码不应该匹配任何分组', () => {
      fc.assert(
        fc.property(
          statusCodeGroupArb,
          (group) => {
            expect(matchStatusCodeGroup(undefined, group)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('状态码过滤', () => {
    it('空状态码数组应该匹配所有请求', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            expect(matchStatusCode(request, [])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pending 状态的请求在有状态码过滤时不应该显示', () => {
      fc.assert(
        fc.property(
          fc.array(statusCodeGroupArb, { minLength: 1, maxLength: 4 }),
          (statusCodes) => {
            const pendingRequest: UIRequest = {
              id: 'test-id',
              url: 'https://example.com',
              method: 'GET',
              status: 'pending',
              type: 'fetch',
              startTime: Date.now(),
              requestHeaders: {},
            };
            
            expect(matchStatusCode(pendingRequest, statusCodes)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('已完成请求的状态码在过滤列表中时应该匹配', () => {
      fc.assert(
        fc.property(
          completedRequestArb,
          (request) => {
            // 确定请求状态码所属的分组
            const statusCode = request.statusCode!;
            let group: string;
            if (statusCode >= 200 && statusCode < 300) group = '2xx';
            else if (statusCode >= 300 && statusCode < 400) group = '3xx';
            else if (statusCode >= 400 && statusCode < 500) group = '4xx';
            else group = '5xx';
            
            // 包含该分组的过滤列表应该匹配
            expect(matchStatusCode(request, [group])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.2**
   * 
   * THE Request_Panel SHALL provide filter buttons for request types (XHR, Fetch, All)
   */
  describe('请求类型过滤', () => {
    it('空类型数组应该匹配所有请求', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            expect(matchType(request, [])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('请求类型在过滤列表中时应该匹配', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            expect(matchType(request, [request.type])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('请求类型不在过滤列表中时不应该匹配', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            const allTypes = ['fetch', 'script', 'stylesheet', 'json', 'document', 'image', 'font', 'other'];
            const otherTypes = allTypes.filter(t => t !== request.type);
            
            if (otherTypes.length > 0) {
              expect(matchType(request, otherTypes)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 5.5**
   * 
   * WHEN filters are applied, THE Request_Panel SHALL only show matching requests
   */
  describe('综合过滤（matchAllCriteria）', () => {
    it('空过滤条件应该匹配所有请求', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            const emptyCriteria: FilterCriteria = {
              search: '',
              methods: [],
              statusCodes: [],
              types: [],
            };
            
            expect(matchAllCriteria(request, emptyCriteria)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('请求必须匹配所有过滤条件才能通过', () => {
      fc.assert(
        fc.property(
          completedRequestArb,
          (request) => {
            // 创建一个匹配请求所有属性的过滤条件
            const statusCode = request.statusCode!;
            let statusGroup: string;
            if (statusCode >= 200 && statusCode < 300) statusGroup = '2xx';
            else if (statusCode >= 300 && statusCode < 400) statusGroup = '3xx';
            else if (statusCode >= 400 && statusCode < 500) statusGroup = '4xx';
            else statusGroup = '5xx';
            
            const matchingCriteria: FilterCriteria = {
              search: '',  // 空搜索匹配所有
              methods: [request.method],
              statusCodes: [statusGroup],
              types: [request.type],
            };
            
            expect(matchAllCriteria(request, matchingCriteria)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('任一条件不匹配时请求不应该通过', () => {
      fc.assert(
        fc.property(
          completedRequestArb,
          (request) => {
            // 创建一个方法不匹配的过滤条件
            const allMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
            const otherMethods = allMethods.filter(m => m !== request.method);
            
            if (otherMethods.length > 0) {
              const nonMatchingCriteria: FilterCriteria = {
                search: '',
                methods: [otherMethods[0]],  // 不匹配的方法
                statusCodes: [],
                types: [],
              };
              
              expect(matchAllCriteria(request, nonMatchingCriteria)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('URL 搜索不匹配时请求不应该通过', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            const nonMatchingCriteria: FilterCriteria = {
              search: '__IMPOSSIBLE_SEARCH_STRING_12345__',
              methods: [],
              statusCodes: [],
              types: [],
            };
            
            // 假设 URL 不包含这个特殊字符串
            if (!request.url.toLowerCase().includes('__impossible_search_string_12345__')) {
              expect(matchAllCriteria(request, nonMatchingCriteria)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('filterRequests 函数', () => {
    it('空请求列表应该返回空数组', () => {
      fc.assert(
        fc.property(
          filterCriteriaArb,
          (criteria) => {
            const result = filterRequests([], criteria);
            expect(result).toEqual([]);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('空过滤条件应该返回所有请求', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 0, maxLength: 20 }),
          (requests) => {
            const emptyCriteria: FilterCriteria = {
              search: '',
              methods: [],
              statusCodes: [],
              types: [],
            };
            
            const result = filterRequests(requests, emptyCriteria);
            expect(result.length).toBe(requests.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('过滤结果应该是原列表的子集', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 0, maxLength: 20 }),
          filterCriteriaArb,
          (requests, criteria) => {
            const result = filterRequests(requests, criteria);
            
            // 结果长度不应该超过原列表
            expect(result.length).toBeLessThanOrEqual(requests.length);
            
            // 结果中的每个请求都应该在原列表中
            for (const filteredRequest of result) {
              expect(requests.some(r => r.id === filteredRequest.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('过滤结果中的每个请求都应该匹配所有条件', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 0, maxLength: 20 }),
          filterCriteriaArb,
          (requests, criteria) => {
            const result = filterRequests(requests, criteria);
            
            // 验证每个结果都匹配所有条件
            for (const request of result) {
              expect(matchAllCriteria(request, criteria)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('不在结果中的请求应该至少有一个条件不匹配', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 1, maxLength: 20 }),
          filterCriteriaArb,
          (requests, criteria) => {
            const result = filterRequests(requests, criteria);
            const resultIds = new Set(result.map(r => r.id));
            
            // 验证不在结果中的请求至少有一个条件不匹配
            for (const request of requests) {
              if (!resultIds.has(request.id)) {
                expect(matchAllCriteria(request, criteria)).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 综合属性测试：过滤功能的幂等性和一致性
   */
  describe('过滤功能属性', () => {
    it('相同条件多次过滤应该得到相同结果（幂等性）', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 0, maxLength: 20 }),
          filterCriteriaArb,
          (requests, criteria) => {
            const result1 = filterRequests(requests, criteria);
            const result2 = filterRequests(requests, criteria);
            
            expect(result1.length).toBe(result2.length);
            expect(result1.map(r => r.id)).toEqual(result2.map(r => r.id));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对已过滤结果再次过滤应该得到相同结果', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 0, maxLength: 20 }),
          filterCriteriaArb,
          (requests, criteria) => {
            const result1 = filterRequests(requests, criteria);
            const result2 = filterRequests(result1, criteria);
            
            expect(result1.length).toBe(result2.length);
            expect(result1.map(r => r.id)).toEqual(result2.map(r => r.id));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('添加更多过滤条件不应该增加结果数量', () => {
      fc.assert(
        fc.property(
          fc.array(completedRequestArb, { minLength: 0, maxLength: 20 }),
          httpMethodArb,
          statusCodeGroupArb,
          (requests, method, statusGroup) => {
            // 只有方法过滤
            const criteriaMethodOnly: FilterCriteria = {
              search: '',
              methods: [method],
              statusCodes: [],
              types: [],
            };
            
            // 方法 + 状态码过滤
            const criteriaMethodAndStatus: FilterCriteria = {
              search: '',
              methods: [method],
              statusCodes: [statusGroup],
              types: [],
            };
            
            const resultMethodOnly = filterRequests(requests, criteriaMethodOnly);
            const resultMethodAndStatus = filterRequests(requests, criteriaMethodAndStatus);
            
            // 添加更多条件后，结果数量应该小于或等于之前
            expect(resultMethodAndStatus.length).toBeLessThanOrEqual(resultMethodOnly.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
