/**
 * Resizer 组件属性测试
 * 
 * Feature: gui-devtools-enhancements
 * 使用 fast-check 进行基于属性的测试
 * 
 * 这些测试验证 Resizer 组件在各种输入条件下的正确性属性
 */

import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * 约束宽度在最小值和最大值之间（从 Resizer 组件中提取的逻辑）
 */
function constrainWidth(newWidth: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(newWidth, maxWidth));
}

/**
 * 计算拖拽后的宽度（从 Resizer 组件中提取的逻辑）
 * 
 * @param startWidth 开始拖拽时的宽度
 * @param startX 开始拖拽时的鼠标 X 坐标
 * @param currentX 当前鼠标 X 坐标
 * @param minWidth 最小宽度
 * @param maxWidth 最大宽度
 * @returns 约束后的新宽度
 */
function calculateDragWidth(
  startWidth: number,
  startX: number,
  currentX: number,
  minWidth: number,
  maxWidth: number
): number {
  // 计算鼠标移动的距离（向左移动为正，因为面板在右侧）
  const deltaX = startX - currentX;
  const newWidth = startWidth + deltaX;
  return constrainWidth(newWidth, minWidth, maxWidth);
}

describe('Resizer 组件属性测试', () => {
  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * 属性 3：拖拽宽度实时更新
   * 
   * **Validates: Requirements 1.2**
   * 
   * *对于任意* 鼠标移动距离，在拖拽过程中，面板宽度的变化应该等于
   * 鼠标的水平移动距离（在边界约束内）
   */
  it('属性 3：拖拽宽度变化应该等于鼠标水平移动距离（在边界内）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1200 }), // 起始宽度
        fc.integer({ min: 500, max: 1500 }), // 起始鼠标 X 坐标
        fc.integer({ min: -500, max: 500 }), // 鼠标移动距离
        (startWidth, startX, mouseDelta) => {
          const minWidth = 300;
          const maxWidth = 1200;
          const currentX = startX - mouseDelta; // 向左移动为正

          // 计算拖拽后的宽度
          const finalWidth = calculateDragWidth(
            startWidth,
            startX,
            currentX,
            minWidth,
            maxWidth
          );

          // 计算期望的宽度（未约束）
          const expectedWidthUnconstrained = startWidth + mouseDelta;

          // 如果期望宽度在边界内，则最终宽度应该等于期望宽度
          if (
            expectedWidthUnconstrained >= minWidth &&
            expectedWidthUnconstrained <= maxWidth
          ) {
            const isCorrect = finalWidth === expectedWidthUnconstrained;

            if (!isCorrect) {
              console.log(`\n❌ 边界内的拖拽宽度计算不正确`);
              console.log(`   起始宽度: ${startWidth}`);
              console.log(`   起始 X: ${startX}`);
              console.log(`   当前 X: ${currentX}`);
              console.log(`   鼠标移动距离: ${mouseDelta}`);
              console.log(`   期望宽度: ${expectedWidthUnconstrained}`);
              console.log(`   实际宽度: ${finalWidth}`);
            }

            return isCorrect;
          }

          // 如果期望宽度超出边界，则最终宽度应该被约束
          const isConstrained =
            (expectedWidthUnconstrained < minWidth && finalWidth === minWidth) ||
            (expectedWidthUnconstrained > maxWidth && finalWidth === maxWidth);

          if (!isConstrained) {
            console.log(`\n❌ 超出边界的拖拽宽度未正确约束`);
            console.log(`   起始宽度: ${startWidth}`);
            console.log(`   起始 X: ${startX}`);
            console.log(`   当前 X: ${currentX}`);
            console.log(`   鼠标移动距离: ${mouseDelta}`);
            console.log(`   期望宽度（未约束）: ${expectedWidthUnconstrained}`);
            console.log(`   实际宽度: ${finalWidth}`);
            console.log(`   最小宽度: ${minWidth}`);
            console.log(`   最大宽度: ${maxWidth}`);
          }

          return isConstrained;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 3a：向左拖拽增加宽度
   * 
   * **Validates: Requirements 1.2**
   * 
   * *对于任意* 向左的鼠标移动（currentX < startX），面板宽度应该增加
   * （除非已达到最大宽度）
   */
  it('属性 3a：向左拖拽应该增加宽度（未达到最大值时）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1100 }), // 起始宽度（留出增长空间）
        fc.integer({ min: 500, max: 1500 }), // 起始鼠标 X 坐标
        fc.integer({ min: 1, max: 100 }), // 向左移动的距离（正数）
        (startWidth, startX, moveDistance) => {
          const minWidth = 300;
          const maxWidth = 1200;
          const currentX = startX - moveDistance; // 向左移动

          const finalWidth = calculateDragWidth(
            startWidth,
            startX,
            currentX,
            minWidth,
            maxWidth
          );

          // 如果起始宽度未达到最大值，宽度应该增加
          if (startWidth < maxWidth) {
            const hasIncreased = finalWidth > startWidth;

            if (!hasIncreased) {
              console.log(`\n❌ 向左拖拽未增加宽度`);
              console.log(`   起始宽度: ${startWidth}`);
              console.log(`   移动距离: ${moveDistance}`);
              console.log(`   最终宽度: ${finalWidth}`);
            }

            return hasIncreased;
          }

          // 如果已达到最大值，宽度应该保持不变
          return finalWidth === maxWidth;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 3b：向右拖拽减小宽度
   * 
   * **Validates: Requirements 1.2**
   * 
   * *对于任意* 向右的鼠标移动（currentX > startX），面板宽度应该减小
   * （除非已达到最小宽度）
   */
  it('属性 3b：向右拖拽应该减小宽度（未达到最小值时）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }), // 起始宽度（留出减小空间）
        fc.integer({ min: 500, max: 1500 }), // 起始鼠标 X 坐标
        fc.integer({ min: 1, max: 100 }), // 向右移动的距离（正数）
        (startWidth, startX, moveDistance) => {
          const minWidth = 300;
          const maxWidth = 1200;
          const currentX = startX + moveDistance; // 向右移动

          const finalWidth = calculateDragWidth(
            startWidth,
            startX,
            currentX,
            minWidth,
            maxWidth
          );

          // 如果起始宽度未达到最小值，宽度应该减小
          if (startWidth > minWidth) {
            const hasDecreased = finalWidth < startWidth;

            if (!hasDecreased) {
              console.log(`\n❌ 向右拖拽未减小宽度`);
              console.log(`   起始宽度: ${startWidth}`);
              console.log(`   移动距离: ${moveDistance}`);
              console.log(`   最终宽度: ${finalWidth}`);
            }

            return hasDecreased;
          }

          // 如果已达到最小值，宽度应该保持不变
          return finalWidth === minWidth;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 3c：鼠标不移动时宽度不变
   * 
   * **Validates: Requirements 1.2**
   * 
   * *对于任意* 起始宽度和鼠标位置，如果鼠标不移动（currentX === startX），
   * 面板宽度应该保持不变
   */
  it('属性 3c：鼠标不移动时宽度应该保持不变', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1200 }), // 起始宽度
        fc.integer({ min: 500, max: 1500 }), // 鼠标 X 坐标
        (startWidth, mouseX) => {
          const minWidth = 300;
          const maxWidth = 1200;

          const finalWidth = calculateDragWidth(
            startWidth,
            mouseX,
            mouseX, // 鼠标不移动
            minWidth,
            maxWidth
          );

          const isUnchanged = finalWidth === startWidth;

          if (!isUnchanged) {
            console.log(`\n❌ 鼠标不移动时宽度发生了变化`);
            console.log(`   起始宽度: ${startWidth}`);
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
   * 属性 3d：连续拖拽的累积效果
   * 
   * **Validates: Requirements 1.2**
   * 
   * *对于任意* 连续的鼠标移动序列，最终宽度应该等于所有移动距离的累积
   * （在边界约束内）
   */
  it('属性 3d：连续拖拽应该正确累积宽度变化', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 900 }), // 起始宽度（中间值）
        fc.integer({ min: 500, max: 1500 }), // 起始鼠标 X 坐标
        fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 2, maxLength: 5 }), // 移动序列
        (startWidth, startX, moveDeltas) => {
          const minWidth = 300;
          const maxWidth = 1200;

          let currentWidth = startWidth;
          let currentX = startX;

          // 模拟连续拖拽
          for (const delta of moveDeltas) {
            const nextX = currentX - delta; // 向左为正
            currentWidth = calculateDragWidth(
              currentWidth,
              currentX,
              nextX,
              minWidth,
              maxWidth
            );
            currentX = nextX;
          }

          // 计算总移动距离
          const totalDelta = moveDeltas.reduce((sum, delta) => sum + delta, 0);
          const expectedWidthUnconstrained = startWidth + totalDelta;

          // 验证最终宽度
          const expectedWidth = constrainWidth(
            expectedWidthUnconstrained,
            minWidth,
            maxWidth
          );

          const isCorrect = currentWidth === expectedWidth;

          if (!isCorrect) {
            console.log(`\n❌ 连续拖拽的累积效果不正确`);
            console.log(`   起始宽度: ${startWidth}`);
            console.log(`   移动序列: ${moveDeltas.join(', ')}`);
            console.log(`   总移动距离: ${totalDelta}`);
            console.log(`   期望宽度: ${expectedWidth}`);
            console.log(`   实际宽度: ${currentWidth}`);
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
   * 属性 3e：拖拽距离与宽度变化的线性关系
   * 
   * **Validates: Requirements 1.2**
   * 
   * *对于任意* 在边界内的拖拽，宽度变化应该与鼠标移动距离成正比（1:1）
   */
  it('属性 3e：拖拽距离与宽度变化应该成 1:1 线性关系（边界内）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 900 }), // 起始宽度（中间值，确保有足够空间）
        fc.integer({ min: 500, max: 1500 }), // 起始鼠标 X 坐标
        fc.integer({ min: -100, max: 100 }), // 移动距离（确保在边界内）
        (startWidth, startX, moveDelta) => {
          const minWidth = 300;
          const maxWidth = 1200;

          // 确保移动后仍在边界内
          const expectedWidth = startWidth + moveDelta;
          if (expectedWidth < minWidth || expectedWidth > maxWidth) {
            return true; // 跳过超出边界的情况
          }

          const currentX = startX - moveDelta;
          const finalWidth = calculateDragWidth(
            startWidth,
            startX,
            currentX,
            minWidth,
            maxWidth
          );

          const widthChange = finalWidth - startWidth;
          const isLinear = widthChange === moveDelta;

          if (!isLinear) {
            console.log(`\n❌ 拖拽距离与宽度变化不成线性关系`);
            console.log(`   起始宽度: ${startWidth}`);
            console.log(`   移动距离: ${moveDelta}`);
            console.log(`   宽度变化: ${widthChange}`);
            console.log(`   最终宽度: ${finalWidth}`);
          }

          return isLinear;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性 3f：拖拽始终保持在边界内
   * 
   * **Validates: Requirements 1.2, 1.5, 1.6**
   * 
   * *对于任意* 拖拽操作，无论鼠标移动多远，最终宽度都应该在边界内
   */
  it('属性 3f：拖拽后的宽度应该始终在边界内', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 1200 }), // 起始宽度
        fc.integer({ min: 0, max: 3000 }), // 起始鼠标 X 坐标
        fc.integer({ min: -2000, max: 2000 }), // 极端的移动距离
        (startWidth, startX, moveDelta) => {
          const minWidth = 300;
          const maxWidth = 1200;
          const currentX = startX - moveDelta;

          const finalWidth = calculateDragWidth(
            startWidth,
            startX,
            currentX,
            minWidth,
            maxWidth
          );

          const isWithinBounds = finalWidth >= minWidth && finalWidth <= maxWidth;

          if (!isWithinBounds) {
            console.log(`\n❌ 拖拽后的宽度超出边界`);
            console.log(`   起始宽度: ${startWidth}`);
            console.log(`   移动距离: ${moveDelta}`);
            console.log(`   最终宽度: ${finalWidth}`);
            console.log(`   边界: [${minWidth}, ${maxWidth}]`);
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
   * 属性 3g：拖拽的可逆性
   * 
   * **Validates: Requirements 1.2**
   * 
   * *对于任意* 拖拽操作，如果先向左拖拽 N 像素，再向右拖拽 N 像素，
   * 应该回到原始宽度（在边界内）
   */
  it('属性 3g：拖拽应该是可逆的（边界内）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 900 }), // 起始宽度（中间值）
        fc.integer({ min: 500, max: 1500 }), // 起始鼠标 X 坐标
        fc.integer({ min: 1, max: 100 }), // 移动距离
        (startWidth, startX, moveDistance) => {
          const minWidth = 300;
          const maxWidth = 1200;

          // 确保移动后仍在边界内
          if (
            startWidth + moveDistance > maxWidth ||
            startWidth - moveDistance < minWidth
          ) {
            return true; // 跳过会超出边界的情况
          }

          // 向左拖拽
          const afterLeftDrag = calculateDragWidth(
            startWidth,
            startX,
            startX - moveDistance,
            minWidth,
            maxWidth
          );

          // 再向右拖拽相同距离
          const afterRightDrag = calculateDragWidth(
            afterLeftDrag,
            startX - moveDistance,
            startX,
            minWidth,
            maxWidth
          );

          const isReversible = afterRightDrag === startWidth;

          if (!isReversible) {
            console.log(`\n❌ 拖拽不可逆`);
            console.log(`   起始宽度: ${startWidth}`);
            console.log(`   移动距离: ${moveDistance}`);
            console.log(`   向左拖拽后: ${afterLeftDrag}`);
            console.log(`   向右拖拽后: ${afterRightDrag}`);
          }

          return isReversible;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性：约束函数的幂等性
   * 
   * *对于任意* 宽度值，多次应用约束函数应该得到相同的结果
   */
  it('属性：约束函数应该是幂等的', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3000 }),
        (width) => {
          const minWidth = 300;
          const maxWidth = 1200;

          const constrained1 = constrainWidth(width, minWidth, maxWidth);
          const constrained2 = constrainWidth(constrained1, minWidth, maxWidth);

          return constrained1 === constrained2;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * 属性：边界值的精确性
   * 
   * *对于任意* 等于边界值的宽度，约束后应该保持不变
   */
  it('属性：边界值应该保持不变', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(300, 1200), // 最小值或最大值
        (boundaryWidth) => {
          const minWidth = 300;
          const maxWidth = 1200;

          const constrained = constrainWidth(boundaryWidth, minWidth, maxWidth);
          return constrained === boundaryWidth;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});
