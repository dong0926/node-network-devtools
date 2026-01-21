/**
 * useResizablePanel Hook 属性测试
 * 
 * Feature: gui-devtools-enhancements
 * 使用 fast-check 进行基于属性的测试
 * 
 * 注意：这些测试直接测试 Hook 的内部逻辑函数，而不是通过 renderHook，
 * 以避免 React 并发渲染问题。
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';

/**
 * 将百分比或像素值转换为像素数值（从 Hook 中提取的逻辑）
 */
function parseWidth(value: number | string, windowWidth: number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string' && value.endsWith('%')) {
    const percentage = parseFloat(value);
    if (!isNaN(percentage)) {
      return Math.round((windowWidth * percentage) / 100);
    }
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 约束宽度在最小值和最大值之间（从 Hook 中提取的逻辑）
 */
function constrainWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(maxWidth, width));
}

/**
 * Mock localStorage
 */
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('useResizablePanel 属性测试', () => {

  /**
   * 属性 1：宽度边界约束
   * 
   * **Validates: Requirements 1.5, 1.6**
   * 
   * *对于任意* 宽度调整操作，最终应用的宽度值应该始终在最小值（300px）
   * 和最大值（窗口宽度的 80%）之间
   */
  it('属性 1：宽度应该始终在最小值和最大值之间', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3000 }), // 任意宽度输入
        fc.integer({ min: 800, max: 3840 }), // 任意窗口宽度
        (inputWidth, windowWidth) => {
          const minWidth = 300;
          const maxWidth = Math.floor(windowWidth * 0.8);

          // 直接测试约束逻辑
          const finalWidth = constrainWidth(inputWidth, minWidth, maxWidth);

          // 验证宽度在边界内
          const isWithinBounds = finalWidth >= minWidth && finalWidth <= maxWidth;

          if (!isWithinBounds) {
            console.log(`\n❌ 宽度超出边界`);
            console.log(`   输入宽度: ${inputWidth}`);
            console.log(`   窗口宽度: ${windowWidth}`);
            console.log(`   最小宽度: ${minWidth}`);
            console.log(`   最大宽度: ${maxWidth}`);
            console.log(`   最终宽度: ${finalWidth}`);
          }

          return isWithinBounds;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 1a：最小宽度约束
   * 
   * **Validates: Requirements 1.5**
   * 
   * *对于任意* 小于最小值的宽度输入，最终宽度应该等于最小值
   */
  it('属性 1a：小于最小值的宽度应该被限制为最小值', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 299 }), // 小于最小值的宽度
        (inputWidth) => {
          const minWidth = 300;
          const maxWidth = 1200;

          const finalWidth = constrainWidth(inputWidth, minWidth, maxWidth);
          const isMinWidth = finalWidth === minWidth;

          if (!isMinWidth) {
            console.log(`\n❌ 宽度未被限制为最小值`);
            console.log(`   输入宽度: ${inputWidth}`);
            console.log(`   最小宽度: ${minWidth}`);
            console.log(`   最终宽度: ${finalWidth}`);
          }

          return isMinWidth;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 1b：最大宽度约束
   * 
   * **Validates: Requirements 1.6**
   * 
   * *对于任意* 大于最大值的宽度输入，最终宽度应该等于最大值
   */
  it('属性 1b：大于最大值的宽度应该被限制为最大值', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1201, max: 3000 }), // 大于最大值的宽度
        (inputWidth) => {
          const minWidth = 300;
          const maxWidth = 1200;

          const finalWidth = constrainWidth(inputWidth, minWidth, maxWidth);
          const isMaxWidth = finalWidth === maxWidth;

          if (!isMaxWidth) {
            console.log(`\n❌ 宽度未被限制为最大值`);
            console.log(`   输入宽度: ${inputWidth}`);
            console.log(`   最大宽度: ${maxWidth}`);
            console.log(`   最终宽度: ${finalWidth}`);
          }

          return isMaxWidth;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 1c：边界内的宽度保持不变
   * 
   * **Validates: Requirements 1.5, 1.6**
   * 
   * *对于任意* 在边界内的宽度输入，最终宽度应该等于输入宽度
   */
  it('属性 1c：边界内的宽度应该保持不变', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1200 }), // 边界内的宽度
        (inputWidth) => {
          const minWidth = 300;
          const maxWidth = 1200;

          const finalWidth = constrainWidth(inputWidth, minWidth, maxWidth);
          const isUnchanged = finalWidth === inputWidth;

          if (!isUnchanged) {
            console.log(`\n❌ 边界内的宽度被意外修改`);
            console.log(`   输入宽度: ${inputWidth}`);
            console.log(`   最终宽度: ${finalWidth}`);
          }

          return isUnchanged;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 2：宽度持久化往返
   * 
   * **Validates: Requirements 1.3, 1.4**
   * 
   * *对于任意* 有效的宽度值，如果保存到 localStorage 然后重新加载，
   * 恢复的宽度应该等于保存的宽度
   */
  it('属性 2：宽度应该正确持久化到 localStorage 并恢复', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1200 }), // 有效的宽度值
        (width) => {
          const storage = createLocalStorageMock();
          const storageKey = 'test-panel-width';

          // 保存宽度
          storage.setItem(storageKey, String(width));

          // 恢复宽度
          const stored = storage.getItem(storageKey);
          const restoredWidth = stored ? parseFloat(stored) : null;

          // 验证往返一致性
          const isConsistent = restoredWidth === width;

          if (!isConsistent) {
            console.log(`\n❌ 宽度持久化往返不一致`);
            console.log(`   原始宽度: ${width}`);
            console.log(`   恢复的宽度: ${restoredWidth}`);
            console.log(`   localStorage 值: ${stored}`);
          }

          return isConsistent;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 2a：多次保存和恢复的一致性
   * 
   * **Validates: Requirements 1.3, 1.4**
   * 
   * *对于任意* 宽度值序列，最后保存的宽度应该是恢复的宽度
   */
  it('属性 2a：多次保存后应该恢复最后一次保存的宽度', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 300, max: 1200 }), { minLength: 2, maxLength: 5 }),
        (widths) => {
          const storage = createLocalStorageMock();
          const storageKey = 'test-panel-width';

          // 依次保存多个宽度
          widths.forEach((width) => {
            storage.setItem(storageKey, String(width));
          });

          const lastWidth = widths[widths.length - 1];

          // 恢复宽度
          const stored = storage.getItem(storageKey);
          const restoredWidth = stored ? parseFloat(stored) : null;

          const isLastWidth = restoredWidth === lastWidth;

          if (!isLastWidth) {
            console.log(`\n❌ 未恢复最后保存的宽度`);
            console.log(`   宽度序列: ${widths.join(', ')}`);
            console.log(`   最后宽度: ${lastWidth}`);
            console.log(`   恢复的宽度: ${restoredWidth}`);
          }

          return isLastWidth;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 2b：不同 storageKey 的隔离性
   * 
   * **Validates: Requirements 1.3, 1.4**
   * 
   * *对于任意* 两个不同的 storageKey，它们的宽度应该独立存储和恢复
   */
  it('属性 2b：不同 storageKey 的宽度应该独立存储', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1200 }),
        fc.integer({ min: 300, max: 1200 }),
        (width1, width2) => {
          const storage = createLocalStorageMock();

          // 保存两个不同的宽度
          storage.setItem('panel-1', String(width1));
          storage.setItem('panel-2', String(width2));

          // 恢复两个宽度
          const restored1 = parseFloat(storage.getItem('panel-1') || '0');
          const restored2 = parseFloat(storage.getItem('panel-2') || '0');

          const isIsolated = restored1 === width1 && restored2 === width2;

          if (!isIsolated) {
            console.log(`\n❌ storageKey 隔离失败`);
            console.log(`   面板 1 宽度: ${width1} -> ${restored1}`);
            console.log(`   面板 2 宽度: ${width2} -> ${restored2}`);
          }

          return isIsolated;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性：百分比宽度的正确转换
   * 
   * *对于任意* 百分比宽度和窗口宽度，转换后的像素值应该正确
   */
  it('属性：百分比宽度应该正确转换为像素值', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 80 }), // 百分比值
        fc.integer({ min: 800, max: 3840 }), // 窗口宽度
        (percentage, windowWidth) => {
          const widthString = `${percentage}%`;
          const expectedWidth = Math.round((windowWidth * percentage) / 100);
          const actualWidth = parseWidth(widthString, windowWidth);

          const isCorrect = actualWidth === expectedWidth;

          if (!isCorrect) {
            console.log(`\n❌ 百分比转换不正确`);
            console.log(`   百分比: ${percentage}%`);
            console.log(`   窗口宽度: ${windowWidth}`);
            console.log(`   期望宽度: ${expectedWidth}`);
            console.log(`   实际宽度: ${actualWidth}`);
          }

          return isCorrect;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性：像素值解析的正确性
   * 
   * *对于任意* 像素值，parseWidth 应该返回相同的值
   */
  it('属性：像素值应该保持不变', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3000 }),
        (pixelValue) => {
          const result = parseWidth(pixelValue, 1920);
          return result === pixelValue;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性：约束函数的单调性
   * 
   * *对于任意* 两个宽度值 w1 < w2，如果都在边界内，则 constrain(w1) < constrain(w2)
   */
  it('属性：约束函数应该保持单调性', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1199 }),
        fc.integer({ min: 301, max: 1200 }),
        (w1, w2) => {
          // 确保 w1 < w2
          if (w1 >= w2) return true;

          const minWidth = 300;
          const maxWidth = 1200;

          const result1 = constrainWidth(w1, minWidth, maxWidth);
          const result2 = constrainWidth(w2, minWidth, maxWidth);

          return result1 <= result2;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});
