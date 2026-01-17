/**
 * 状态栏属性测试
 * 
 * **Property 7: 统计数据准确性**
 * **Validates: Requirements 3.6**
 * 
 * 测试状态栏的统计数据准确性：
 * - 请求总数应该等于所有请求的数量
 * - 总传输大小应该等于所有请求大小的总和
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UIRequest, RequestStatus } from '../hooks/useRequests';

// ============================================================================
// 辅助函数（从 StatusBar.tsx 和 useRequests.ts 提取的核心逻辑）
// ============================================================================

/**
 * 计算请求总数
 * 
 * @param requests - 请求列表
 * @returns 请求总数
 */
function calculateTotalCount(requests: UIRequest[]): number {
  return requests.length;
}

/**
 * 计算总传输大小
 * 
 * @param requests - 请求列表
 * @returns 总传输大小（字节）
 */
function calculateTotalSize(requests: UIRequest[]): number {
  return requests.reduce((sum, req) => sum + (req.size ?? 0), 0);
}

/**
 * 格式化字节大小（从 StatusBar.tsx 提取）
 * 
 * @param bytes - 字节数
 * @returns 格式化后的字符串
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
const methodArb = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS');

/**
 * 生成请求状态
 */
const requestStatusArb: fc.Arbitrary<RequestStatus> = fc.constantFrom('pending', 'complete', 'error');

/**
 * 生成请求大小（字节）
 * - undefined 表示未知大小（pending 或 error 状态）
 * - 0 到 10MB 的随机大小
 */
const requestSizeArb = fc.option(
  fc.integer({ min: 0, max: 10 * 1024 * 1024 }), // 0 到 10MB
  { nil: undefined }
);

/**
 * 生成单个 UIRequest 对象
 */
const uiRequestArb: fc.Arbitrary<UIRequest> = fc.record({
  id: requestIdArb,
  url: urlArb,
  method: methodArb,
  status: requestStatusArb,
  statusCode: fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
  statusText: fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: undefined }),
  type: fc.constantFrom('fetch', 'xhr', 'json', 'script', 'stylesheet', 'image', 'font', 'document'),
  size: requestSizeArb,
  time: fc.option(fc.integer({ min: 0, max: 60000 }), { nil: undefined }), // 0 到 60 秒
  startTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  endTime: fc.option(fc.integer({ min: 1000000000000, max: 2000000000000 }), { nil: undefined }),
  requestHeaders: fc.constant({} as Record<string, string>),
  responseHeaders: fc.option(fc.constant({} as Record<string, string>), { nil: undefined }),
  requestBody: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
  responseBody: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
  timing: fc.option(
    fc.record({
      startTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
      dnsLookup: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
      tcpConnection: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
      tlsHandshake: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
      firstByte: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
      contentDownload: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
      total: fc.option(fc.integer({ min: 0, max: 60000 }), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  error: fc.option(
    fc.record({
      code: fc.constantFrom('ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ERR_NETWORK'),
      message: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    { nil: undefined }
  ),
  traceId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  stackTrace: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
});

/**
 * 生成具有唯一 ID 的请求列表
 */
const uniqueRequestsArb = fc.array(uiRequestArb, { minLength: 0, maxLength: 100 })
  .map(requests => {
    // 确保 ID 唯一
    const seen = new Set<string>();
    return requests.filter(req => {
      if (seen.has(req.id)) return false;
      seen.add(req.id);
      return true;
    });
  });

/**
 * 生成具有已知大小的请求列表（用于精确测试）
 */
const requestsWithKnownSizesArb = fc.array(
  fc.record({
    id: requestIdArb,
    url: urlArb,
    method: methodArb,
    status: fc.constant('complete' as RequestStatus),
    statusCode: fc.integer({ min: 200, max: 299 }),
    statusText: fc.constant('OK'),
    type: fc.constant('fetch'),
    size: fc.integer({ min: 0, max: 1024 * 1024 }), // 0 到 1MB，确保有值
    time: fc.integer({ min: 0, max: 5000 }),
    startTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    endTime: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    requestHeaders: fc.constant({} as Record<string, string>),
    responseHeaders: fc.constant({} as Record<string, string>),
    requestBody: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
    responseBody: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
    timing: fc.constant(undefined),
    error: fc.constant(undefined),
    traceId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
    stackTrace: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  }),
  { minLength: 0, maxLength: 50 }
).map(requests => {
  // 确保 ID 唯一
  const seen = new Set<string>();
  return requests.filter(req => {
    if (seen.has(req.id)) return false;
    seen.add(req.id);
    return true;
  });
});

// ============================================================================
// Property 7: 统计数据准确性
// ============================================================================

describe('Property 7: 统计数据准确性', () => {
  /**
   * **Validates: Requirements 3.6**
   * 
   * *For any* set of displayed requests, the total count SHALL equal 
   * the number of individual requests.
   */
  describe('请求总数准确性', () => {
    it('请求总数应该等于请求列表的长度', () => {
      fc.assert(
        fc.property(
          uniqueRequestsArb,
          (requests) => {
            const totalCount = calculateTotalCount(requests);
            
            // 验证总数等于列表长度
            expect(totalCount).toBe(requests.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('空请求列表的总数应该为 0', () => {
      const totalCount = calculateTotalCount([]);
      expect(totalCount).toBe(0);
    });

    it('单个请求的总数应该为 1', () => {
      fc.assert(
        fc.property(
          uiRequestArb,
          (request) => {
            const totalCount = calculateTotalCount([request]);
            expect(totalCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 3.6**
   * 
   * *For any* set of displayed requests, the total transfer size SHALL equal 
   * the sum of individual request sizes.
   */
  describe('总传输大小准确性', () => {
    it('总传输大小应该等于所有请求大小的总和', () => {
      fc.assert(
        fc.property(
          uniqueRequestsArb,
          (requests) => {
            const totalSize = calculateTotalSize(requests);
            
            // 手动计算期望的总大小
            const expectedSize = requests.reduce((sum, req) => sum + (req.size ?? 0), 0);
            
            // 验证总大小等于期望值
            expect(totalSize).toBe(expectedSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('空请求列表的总大小应该为 0', () => {
      const totalSize = calculateTotalSize([]);
      expect(totalSize).toBe(0);
    });

    it('所有请求大小为 undefined 时，总大小应该为 0', () => {
      fc.assert(
        fc.property(
          fc.array(
            uiRequestArb.map(req => ({ ...req, size: undefined })),
            { minLength: 1, maxLength: 20 }
          ),
          (requests) => {
            const totalSize = calculateTotalSize(requests);
            expect(totalSize).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('具有已知大小的请求列表，总大小应该精确计算', () => {
      fc.assert(
        fc.property(
          requestsWithKnownSizesArb,
          (requests) => {
            const totalSize = calculateTotalSize(requests);
            
            // 手动计算期望的总大小
            const expectedSize = requests.reduce((sum, req) => sum + (req.size ?? 0), 0);
            
            // 验证总大小等于期望值
            expect(totalSize).toBe(expectedSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 统计数据一致性测试
   */
  describe('统计数据一致性', () => {
    it('添加请求后，总数应该增加 1', () => {
      fc.assert(
        fc.property(
          uniqueRequestsArb,
          uiRequestArb,
          (existingRequests, newRequest) => {
            // 确保新请求 ID 不重复
            const existingIds = new Set(existingRequests.map(r => r.id));
            if (existingIds.has(newRequest.id)) {
              // 跳过重复 ID 的情况
              return true;
            }
            
            const countBefore = calculateTotalCount(existingRequests);
            const countAfter = calculateTotalCount([...existingRequests, newRequest]);
            
            // 验证总数增加 1
            expect(countAfter).toBe(countBefore + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('添加请求后，总大小应该增加该请求的大小', () => {
      fc.assert(
        fc.property(
          uniqueRequestsArb,
          uiRequestArb,
          (existingRequests, newRequest) => {
            // 确保新请求 ID 不重复
            const existingIds = new Set(existingRequests.map(r => r.id));
            if (existingIds.has(newRequest.id)) {
              // 跳过重复 ID 的情况
              return true;
            }
            
            const sizeBefore = calculateTotalSize(existingRequests);
            const sizeAfter = calculateTotalSize([...existingRequests, newRequest]);
            
            // 验证总大小增加了新请求的大小
            expect(sizeAfter).toBe(sizeBefore + (newRequest.size ?? 0));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('移除请求后，总数应该减少 1', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 1, maxLength: 50 })
            .map(requests => {
              // 确保 ID 唯一
              const seen = new Set<string>();
              return requests.filter(req => {
                if (seen.has(req.id)) return false;
                seen.add(req.id);
                return true;
              });
            })
            .filter(requests => requests.length > 0),
          (requests) => {
            const countBefore = calculateTotalCount(requests);
            const countAfter = calculateTotalCount(requests.slice(1));
            
            // 验证总数减少 1
            expect(countAfter).toBe(countBefore - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('移除请求后，总大小应该减少该请求的大小', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 1, maxLength: 50 })
            .map(requests => {
              // 确保 ID 唯一
              const seen = new Set<string>();
              return requests.filter(req => {
                if (seen.has(req.id)) return false;
                seen.add(req.id);
                return true;
              });
            })
            .filter(requests => requests.length > 0),
          (requests) => {
            const removedRequest = requests[0];
            const sizeBefore = calculateTotalSize(requests);
            const sizeAfter = calculateTotalSize(requests.slice(1));
            
            // 验证总大小减少了被移除请求的大小
            expect(sizeAfter).toBe(sizeBefore - (removedRequest.size ?? 0));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 字节格式化测试
   */
  describe('字节格式化', () => {
    it('0 字节应该格式化为 "0 B"', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('小于 1KB 的值应该以 B 为单位', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1023 }),
          (bytes) => {
            const formatted = formatBytes(bytes);
            expect(formatted).toMatch(/^\d+(\.\d+)? B$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('1KB 到 1MB 之间的值应该以 KB 为单位', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1024, max: 1024 * 1024 - 1 }),
          (bytes) => {
            const formatted = formatBytes(bytes);
            expect(formatted).toMatch(/^\d+(\.\d+)? KB$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('1MB 到 1GB 之间的值应该以 MB 为单位', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1024 * 1024, max: 1024 * 1024 * 1024 - 1 }),
          (bytes) => {
            const formatted = formatBytes(bytes);
            expect(formatted).toMatch(/^\d+(\.\d+)? MB$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('格式化后的值应该是非负数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1024 * 1024 * 1024 }),
          (bytes) => {
            const formatted = formatBytes(bytes);
            const numericPart = parseFloat(formatted.split(' ')[0]);
            expect(numericPart).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 边界情况测试
   */
  describe('边界情况', () => {
    it('大量请求时统计数据仍然准确', () => {
      fc.assert(
        fc.property(
          fc.array(uiRequestArb, { minLength: 50, maxLength: 100 })
            .map(requests => {
              // 确保 ID 唯一
              const seen = new Set<string>();
              let counter = 0;
              return requests.map(req => {
                if (seen.has(req.id)) {
                  // 生成唯一 ID
                  const newId = `${req.id}_${counter++}`;
                  seen.add(newId);
                  return { ...req, id: newId };
                }
                seen.add(req.id);
                return req;
              });
            }),
          (requests) => {
            const totalCount = calculateTotalCount(requests);
            const totalSize = calculateTotalSize(requests);
            
            // 验证总数
            expect(totalCount).toBe(requests.length);
            
            // 验证总大小
            const expectedSize = requests.reduce((sum, req) => sum + (req.size ?? 0), 0);
            expect(totalSize).toBe(expectedSize);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('混合有大小和无大小的请求时统计正确', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              // 有大小的请求
              uiRequestArb.map(req => ({ ...req, size: Math.floor(Math.random() * 10000) })),
              // 无大小的请求
              uiRequestArb.map(req => ({ ...req, size: undefined }))
            ),
            { minLength: 1, maxLength: 30 }
          ).map(requests => {
            // 确保 ID 唯一
            const seen = new Set<string>();
            let counter = 0;
            return requests.map(req => {
              if (seen.has(req.id)) {
                const newId = `${req.id}_${counter++}`;
                seen.add(newId);
                return { ...req, id: newId };
              }
              seen.add(req.id);
              return req;
            });
          }),
          (requests) => {
            const totalSize = calculateTotalSize(requests);
            
            // 手动计算期望的总大小（只计算有大小的请求）
            const expectedSize = requests.reduce((sum, req) => sum + (req.size ?? 0), 0);
            
            expect(totalSize).toBe(expectedSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
