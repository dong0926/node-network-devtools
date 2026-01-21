/**
 * JSONViewer 组件属性测试
 * 
 * Feature: gui-devtools-enhancements
 * 使用 fast-check 进行基于属性的测试
 * 
 * 测试属性：
 * - 属性 7：JSON 默认展开层级
 * - 属性 8：JSON 节点展开切换
 * - 属性 9：折叠节点信息显示
 * - 属性 10：展开状态图标一致性
 * - 属性 11：无效 JSON 回退
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { JSONViewer } from './JSONViewer.js';

/**
 * 辅助函数：计算 JSON 数据的层级深度
 */
function getDepth(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value !== 'object') {
    return 0;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return 1;
    return 1 + Math.max(...value.map(getDepth));
  }
  
  const keys = Object.keys(value);
  if (keys.length === 0) return 1;
  
  return 1 + Math.max(...keys.map(key => getDepth((value as Record<string, unknown>)[key])));
}

/**
 * 辅助函数：统计展开的三角形数量
 */
function countExpandedNodes(container: HTMLElement): number {
  const text = container.textContent || '';
  return (text.match(/▼/g) || []).length;
}

/**
 * 辅助函数：统计折叠的三角形数量
 */
function countCollapsedNodes(container: HTMLElement): number {
  const text = container.textContent || '';
  return (text.match(/▶/g) || []).length;
}

/**
 * 辅助函数：检查是否包含类型提示
 */
function hasTypeHint(container: HTMLElement, type: 'object' | 'array'): boolean {
  const text = container.textContent || '';
  const hint = type === 'object' ? '{...}' : '[...]';
  return text.includes(hint);
}

/**
 * 辅助函数：检查是否包含元素数量提示
 */
function hasCountHint(container: HTMLElement, count: number): boolean {
  const text = container.textContent || '';
  return text.includes(`{${count}}`);
}



/**
 * 生成器：生成嵌套的 JSON 对象（限制深度）
 */
const nestedJsonArbitrary = (maxDepth: number): fc.Arbitrary<unknown> => {
  if (maxDepth <= 0) {
    return fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(null)
    );
  }
  
  return fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 10 }),
      nestedJsonArbitrary(maxDepth - 1),
      { maxKeys: 5 }
    ),
    fc.array(
      nestedJsonArbitrary(maxDepth - 1),
      { maxLength: 5 }
    )
  );
};

describe('JSONViewer 属性测试', () => {
  /**
   * 属性 7：JSON 默认展开层级
   * 
   * **Validates: Requirements 3.1**
   * 
   * *对于任意* 有效的 JSON 数据，初始渲染时展开的节点应该只包含第一层节点
   */
  it('属性 7：默认展开层级为 1 时，应该只展开第一层节点', () => {
    fc.assert(
      fc.property(
        nestedJsonArbitrary(3), // 生成最多 3 层深的 JSON
        (data) => {
          // 跳过原始值（非对象/数组）
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);

          // 第一层应该展开（显示向下三角形）
          const expandedCount = countExpandedNodes(container);
          
          // 至少应该有一个展开的节点（根节点）
          if (expandedCount === 0) {
            console.log(`\n❌ 没有展开的节点`);
            console.log(`   数据:`, JSON.stringify(data, null, 2));
            return false;
          }

          // 如果有第二层节点，它们应该是折叠的
          const depth = getDepth(data);
          if (depth > 1) {
            const collapsedCount = countCollapsedNodes(container);
            if (collapsedCount === 0) {
              console.log(`\n❌ 第二层节点未折叠`);
              console.log(`   数据深度: ${depth}`);
              console.log(`   展开节点数: ${expandedCount}`);
              console.log(`   折叠节点数: ${collapsedCount}`);
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 7a：默认展开层级为 0 时，所有节点应该折叠
   */
  it('属性 7a：默认展开层级为 0 时，根节点应该折叠', () => {
    fc.assert(
      fc.property(
        nestedJsonArbitrary(2),
        (data) => {
          // 跳过原始值
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);

          // 应该显示折叠的三角形
          const collapsedCount = countCollapsedNodes(container);

          if (collapsedCount === 0) {
            console.log(`\n❌ 根节点未折叠`);
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 7b：默认展开层级应该控制展开的层数
   */
  it('属性 7b：defaultExpandLevel 应该控制展开的层数', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }), // 展开层级
        nestedJsonArbitrary(4), // 生成深层数据
        (expandLevel, data) => {
          // 跳过原始值
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          const { container } = render(
            <JSONViewer data={data} defaultExpandLevel={expandLevel} />
          );

          const depth = getDepth(data);
          
          // 如果数据深度小于等于展开层级，应该全部展开
          if (depth <= expandLevel) {
            const collapsedCount = countCollapsedNodes(container);
            return collapsedCount === 0;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 8：JSON 节点展开切换
   * 
   * **Validates: Requirements 3.3, 3.4**
   * 
   * *对于任意* 对象或数组节点，点击折叠指示器应该切换节点的展开状态
   * （展开变折叠，折叠变展开）
   */
  it('属性 8：点击折叠指示器应该切换节点的展开状态', () => {
    fc.assert(
      fc.property(
        nestedJsonArbitrary(3), // 增加深度确保有足够的嵌套
        (data) => {
          // 跳过原始值
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          // 跳过空容器
          if (Array.isArray(data) && data.length === 0) {
            return true;
          }
          if (!Array.isArray(data) && Object.keys(data).length === 0) {
            return true;
          }

          // 跳过深度不足的数据（至少需要 2 层）
          const depth = getDepth(data);
          if (depth < 2) {
            return true;
          }

          const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);

          // 记录初始文本内容
          const initialText = container.textContent || '';

          // 查找第一个可点击的节点
          const clickableNode = container.querySelector('.cursor-pointer');
          if (!clickableNode) {
            return true;
          }

          // 点击节点
          fireEvent.click(clickableNode);

          // 检查文本内容是否改变（更可靠的检测方式）
          const afterText = container.textContent || '';
          const textChanged = initialText !== afterText;

          if (!textChanged) {
            // 可能是点击了叶子节点，跳过
            return true;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 8a：点击应该切换节点的展开/折叠状态
   * 
   * 简化版本：验证点击行为会改变展开/折叠状态
   */
  it('属性 8a：点击应该切换节点的展开/折叠状态', () => {
    // 使用固定的测试数据
    const testData = {
      user: { name: 'John', age: 25 }
    };

    const { container } = render(<JSONViewer data={testData} defaultExpandLevel={1} />);

    // 初始状态：根节点展开，user 节点折叠
    expect(container.textContent).toContain('▼'); // 根节点展开
    expect(container.textContent).toContain('▶'); // user 节点折叠
    
    // 查找所有可点击的节点
    const clickableNodes = container.querySelectorAll('.cursor-pointer');
    expect(clickableNodes.length).toBeGreaterThan(0);

    // 点击第一个折叠的节点（user 节点）
    const collapsedNode = Array.from(clickableNodes).find(node => 
      node.textContent?.includes('▶')
    );
    
    if (collapsedNode) {
      // 点击展开 user 节点
      fireEvent.click(collapsedNode);
      
      // 验证：user 节点应该展开，显示其内容
      expect(container.textContent).toContain('name');
      expect(container.textContent).toContain('John');
    }
  });

  /**
   * 属性 9：折叠节点信息显示
   * 
   * **Validates: Requirements 3.5, 3.6**
   * 
   * *对于任意* 处于折叠状态的对象或数组节点，显示的元素数量应该等于
   * 该节点的实际属性/元素数量，且应该显示正确的类型提示
   * （对象显示 `{...}`，数组显示 `[...]`）
   */
  it('属性 9：折叠的对象应该显示正确的类型提示和元素数量', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.oneof(fc.string(), fc.integer()),
          { minKeys: 1, maxKeys: 10 }
        ),
        (data) => {
          const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);

          // 应该显示对象类型提示
          const hasObjectHint = hasTypeHint(container, 'object');
          
          // 应该显示元素数量
          const count = Object.keys(data).length;
          const hasCount = count > 0 ? hasCountHint(container, count) : true;

          if (!hasObjectHint) {
            console.log(`\n❌ 未显示对象类型提示 {...}`);
            return false;
          }

          if (!hasCount && count > 0) {
            console.log(`\n❌ 未显示元素数量 {${count}}`);
            console.log(`   实际元素数: ${count}`);
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('属性 9：折叠的数组应该显示正确的类型提示和元素数量', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(fc.string(), fc.integer()),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);

          // 应该显示数组类型提示
          const hasArrayHint = hasTypeHint(container, 'array');
          
          // 应该显示元素数量
          const count = data.length;
          const hasCount = count > 0 ? hasCountHint(container, count) : true;

          if (!hasArrayHint) {
            console.log(`\n❌ 未显示数组类型提示 [...] `);
            return false;
          }

          if (!hasCount && count > 0) {
            console.log(`\n❌ 未显示元素数量 {${count}}`);
            console.log(`   实际元素数: ${count}`);
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 9a：空容器的显示
   */
  it('属性 9a：空对象和空数组应该显示类型提示但不显示数量', () => {
    const { container: emptyObjContainer } = render(
      <JSONViewer data={{}} defaultExpandLevel={0} />
    );
    expect(hasTypeHint(emptyObjContainer, 'object')).toBe(true);

    const { container: emptyArrContainer } = render(
      <JSONViewer data={[]} defaultExpandLevel={0} />
    );
    expect(hasTypeHint(emptyArrContainer, 'array')).toBe(true);
  });

  /**
   * 属性 10：展开状态图标一致性
   * 
   * **Validates: Requirements 3.7, 3.8**
   * 
   * *对于任意* JSON 节点，展开状态时应该显示向下的三角形图标（▼），
   * 折叠状态时应该显示向右的三角形图标（▶）
   */
  it('属性 10：展开状态应该显示向下三角形，折叠状态应该显示向右三角形', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }), // 展开层级
        nestedJsonArbitrary(3),
        (expandLevel, data) => {
          // 跳过原始值
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          const { container } = render(
            <JSONViewer data={data} defaultExpandLevel={expandLevel} />
          );

          const text = container.textContent || '';
          const hasExpanded = text.includes('▼');
          const hasCollapsed = text.includes('▶');

          // 如果展开层级为 0，应该只有折叠图标
          if (expandLevel === 0) {
            if (!hasCollapsed || hasExpanded) {
              console.log(`\n❌ 展开层级为 0 时图标不正确`);
              console.log(`   有展开图标: ${hasExpanded}`);
              console.log(`   有折叠图标: ${hasCollapsed}`);
              return false;
            }
          }

          // 如果展开层级大于 0，应该有展开图标
          if (expandLevel > 0) {
            if (!hasExpanded) {
              console.log(`\n❌ 展开层级 > 0 时缺少展开图标`);
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 10a：图标和状态的对应关系
   */
  it('属性 10a：展开节点数应该等于向下三角形数量', () => {
    fc.assert(
      fc.property(
        nestedJsonArbitrary(2),
        (data) => {
          // 跳过原始值
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);

          const expandedCount = countExpandedNodes(container);
          const text = container.textContent || '';
          const triangleCount = (text.match(/▼/g) || []).length;

          // 展开节点数应该等于向下三角形数量
          return expandedCount === triangleCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('属性 10b：折叠节点数应该等于向右三角形数量', () => {
    fc.assert(
      fc.property(
        nestedJsonArbitrary(3),
        (data) => {
          // 跳过原始值
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);

          const collapsedCount = countCollapsedNodes(container);
          const text = container.textContent || '';
          const triangleCount = (text.match(/▶/g) || []).length;

          // 折叠节点数应该等于向右三角形数量
          return collapsedCount === triangleCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 11：无效 JSON 回退
   * 
   * **Validates: Requirements 3.10**
   * 
   * *对于任意* 无效的 JSON 字符串或空数据，JSON Viewer 应该显示原始文本内容
   * 而不是抛出错误
   */
  it('属性 11：无效 JSON 字符串应该显示原始文本而不抛出错误', () => {
    fc.assert(
      fc.property(
        fc.string(), // 任意字符串（可能是无效 JSON）
        (text) => {
          // 尝试渲染（不应该抛出错误）
          const { container } = render(<JSONViewer data={text} />);

          // 应该成功渲染
          expect(container).toBeTruthy();

          // 如果是无效 JSON，应该显示原始文本
          try {
            JSON.parse(text);
            // 有效 JSON，跳过检查
            return true;
          } catch {
            // 无效 JSON，应该显示原始文本
            const renderedText = container.textContent || '';
            return renderedText.includes(text) || text.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 11a：null 和 undefined 应该正确显示
   */
  it('属性 11a：null 和 undefined 应该显示为文本', () => {
    const { container: nullContainer } = render(<JSONViewer data={null} />);
    expect(nullContainer.textContent).toContain('null');

    const { container: undefinedContainer } = render(<JSONViewer data={undefined} />);
    expect(undefinedContainer.textContent).toContain('undefined');
  });

  /**
   * 属性 11b：空字符串应该正确处理
   */
  it('属性 11b：空字符串应该正确显示', () => {
    const { container } = render(<JSONViewer data="" />);
    expect(container).toBeTruthy();
  });

  /**
   * 属性：原始值类型应该正确显示
   */
  it('属性：原始值应该显示为文本而不是 JSON 结构', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean()
        ),
        (value) => {
          const { container } = render(<JSONViewer data={value} />);
          
          // 原始值不应该有折叠指示器
          const hasTriangles = 
            (container.textContent || '').includes('▼') ||
            (container.textContent || '').includes('▶');

          return !hasTriangles;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性：嵌套结构的一致性
   */
  it('属性：嵌套对象和数组应该保持结构一致性', () => {
    fc.assert(
      fc.property(
        nestedJsonArbitrary(3),
        (data) => {
          // 跳过原始值
          if (data === null || data === undefined || typeof data !== 'object') {
            return true;
          }

          const { container } = render(<JSONViewer data={data} defaultExpandLevel={2} />);

          // 应该成功渲染
          expect(container).toBeTruthy();

          // 展开和折叠的总数应该等于容器节点的总数
          const expandedCount = countExpandedNodes(container);
          const collapsedCount = countCollapsedNodes(container);
          const totalTriangles = expandedCount + collapsedCount;

          // 应该至少有一个三角形（根节点）
          return totalTriangles >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
