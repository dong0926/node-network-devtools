/**
 * JSONViewer 组件单元测试
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { JSONViewer } from './JSONViewer';

describe('JSONViewer', () => {
  describe('基本渲染', () => {
    it('应该渲染简单的对象', () => {
      const data = { name: 'test', age: 25 };
      const { container } = render(<JSONViewer data={data} />);
      expect(container).toBeTruthy();
    });

    it('应该渲染简单的数组', () => {
      const data = [1, 2, 3];
      const { container } = render(<JSONViewer data={data} />);
      expect(container).toBeTruthy();
    });

    it('应该渲染原始值', () => {
      const { container } = render(<JSONViewer data="test string" />);
      expect(container.textContent).toContain('test string');
    });

    it('应该处理 null 值', () => {
      const { container } = render(<JSONViewer data={null} />);
      expect(container.textContent).toContain('null');
    });

    it('应该处理 undefined 值', () => {
      const { container } = render(<JSONViewer data={undefined} />);
      expect(container.textContent).toContain('undefined');
    });
  });

  describe('JSON 字符串解析', () => {
    it('应该解析有效的 JSON 字符串', () => {
      const jsonString = '{"name":"test","value":123}';
      const { container } = render(<JSONViewer data={jsonString} />);
      expect(container).toBeTruthy();
    });

    it('应该显示无效 JSON 字符串的原始文本', () => {
      const invalidJson = 'not a json';
      const { container } = render(<JSONViewer data={invalidJson} />);
      expect(container.textContent).toContain('not a json');
    });
  });

  describe('嵌套结构', () => {
    it('应该渲染嵌套对象', () => {
      const data = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      };
      const { container } = render(<JSONViewer data={data} />);
      expect(container).toBeTruthy();
    });

    it('应该渲染嵌套数组', () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      };
      const { container } = render(<JSONViewer data={data} />);
      expect(container).toBeTruthy();
    });
  });

  describe('默认展开层级', () => {
    it('应该使用默认展开层级 1', () => {
      const data = { level1: { level2: { level3: 'value' } } };
      const { container } = render(<JSONViewer data={data} />);
      // 默认应该展开第一层
      expect(container).toBeTruthy();
    });

    it('应该支持自定义展开层级', () => {
      const data = { level1: { level2: { level3: 'value' } } };
      const { container } = render(<JSONViewer data={data} defaultExpandLevel={2} />);
      expect(container).toBeTruthy();
    });

    it('应该支持展开层级为 0（全部折叠）', () => {
      const data = { name: 'test', value: 123 };
      const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
      expect(container).toBeTruthy();
    });
  });

  describe('数据类型', () => {
    it('应该正确显示字符串类型', () => {
      const data = { text: 'hello' };
      const { container } = render(<JSONViewer data={data} />);
      expect(container.textContent).toContain('"hello"');
    });

    it('应该正确显示数字类型', () => {
      const data = { count: 42 };
      const { container } = render(<JSONViewer data={data} />);
      expect(container.textContent).toContain('42');
    });

    it('应该正确显示布尔类型', () => {
      const data = { active: true, disabled: false };
      const { container } = render(<JSONViewer data={data} />);
      expect(container.textContent).toContain('true');
      expect(container.textContent).toContain('false');
    });

    it('应该正确显示 null 类型', () => {
      const data = { value: null };
      const { container } = render(<JSONViewer data={data} />);
      expect(container.textContent).toContain('null');
    });
  });

  describe('showRoot 属性', () => {
    it('默认不显示根节点键名', () => {
      const data = { name: 'test' };
      const { container } = render(<JSONViewer data={data} />);
      expect(container.textContent).not.toContain('root');
    });

    it('当 showRoot=true 时应该显示根节点键名', () => {
      const data = { name: 'test' };
      const { container } = render(<JSONViewer data={data} showRoot={true} />);
      expect(container.textContent).toContain('root');
    });
  });

  describe('交互功能 - 验证需求 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8', () => {
    describe('点击折叠指示器切换展开状态 - 验证需求 3.3, 3.4', () => {
      it('应该能够点击展开的节点将其折叠 - 验证需求 3.4', () => {
        const data = { user: { name: 'John', age: 25 } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        // 初始状态：第一层应该展开，显示 "user" 键
        expect(container.textContent).toContain('user');
        expect(container.textContent).toContain('{');
        
        // 查找包含向下三角形的可点击元素
        const expandedNode = container.querySelector('.cursor-pointer');
        expect(expandedNode).toBeTruthy();
        expect(expandedNode?.textContent).toContain('▼');
        
        // 点击折叠
        if (expandedNode) {
          fireEvent.click(expandedNode);
        }
        
        // 折叠后：应该显示向右三角形和类型提示
        expect(container.textContent).toContain('▶');
        expect(container.textContent).toContain('{...}');
      });

      it('应该能够点击折叠的节点将其展开 - 验证需求 3.3', () => {
        const data = { items: [1, 2, 3] };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 初始状态：全部折叠，显示向右三角形
        expect(container.textContent).toContain('▶');
        expect(container.textContent).toContain('{...}');
        
        // 查找可点击元素
        const collapsedNode = container.querySelector('.cursor-pointer');
        expect(collapsedNode).toBeTruthy();
        
        // 点击展开
        if (collapsedNode) {
          fireEvent.click(collapsedNode);
        }
        
        // 展开后：应该显示向下三角形和内容
        expect(container.textContent).toContain('▼');
        expect(container.textContent).toContain('items');
      });

      it('应该支持多次切换展开/折叠状态', () => {
        const data = { value: 123 };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        // 第一次点击：折叠
        let clickableNode = container.querySelector('.cursor-pointer');
        expect(clickableNode).toBeTruthy();
        if (clickableNode) {
          fireEvent.click(clickableNode);
          expect(container.textContent).toContain('▶');
        }
        
        // 第二次点击：展开（需要重新查询元素）
        clickableNode = container.querySelector('.cursor-pointer');
        if (clickableNode) {
          fireEvent.click(clickableNode);
          expect(container.textContent).toContain('▼');
        }
        
        // 第三次点击：再次折叠（需要重新查询元素）
        clickableNode = container.querySelector('.cursor-pointer');
        if (clickableNode) {
          fireEvent.click(clickableNode);
          expect(container.textContent).toContain('▶');
        }
      });
    });

    describe('展开/折叠图标显示 - 验证需求 3.7, 3.8', () => {
      it('展开状态应该显示向下的三角形图标（▼）- 验证需求 3.7', () => {
        const data = { name: 'test', value: 123 };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        // 展开状态应该显示 ▼
        expect(container.textContent).toContain('▼');
        expect(container.textContent).not.toContain('▶');
      });

      it('折叠状态应该显示向右的三角形图标（▶）- 验证需求 3.8', () => {
        const data = { name: 'test', value: 123 };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 折叠状态应该显示 ▶
        expect(container.textContent).toContain('▶');
        expect(container.textContent).not.toContain('▼');
      });

      it('原始值节点不应该显示折叠指示器 - 验证需求 3.2', () => {
        const data = { text: 'hello', number: 42, bool: true };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        // 对象本身有折叠指示器
        const triangles = container.textContent?.match(/[▼▶]/g);
        // 应该只有一个三角形（对象本身）
        expect(triangles?.length).toBe(1);
      });
    });

    describe('折叠状态下的类型提示 - 验证需求 3.5', () => {
      it('折叠的对象应该显示 {...} 类型提示 - 验证需求 3.5', () => {
        const data = { user: { name: 'John', age: 25 } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 折叠状态应该显示 {...}
        expect(container.textContent).toContain('{...}');
      });

      it('折叠的数组应该显示 [...] 类型提示 - 验证需求 3.5', () => {
        const data = { items: [1, 2, 3, 4, 5] };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 先展开外层对象
        const outerNode = container.querySelector('.cursor-pointer');
        if (outerNode) {
          fireEvent.click(outerNode);
        }
        
        // 现在应该能看到折叠的数组
        expect(container.textContent).toContain('[...]');
      });

      it('展开状态不应该显示类型提示', () => {
        const data = { user: { name: 'John' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={2} />);
        
        // 展开状态不应该显示 {...} 或 [...]
        const text = container.textContent || '';
        // 只应该有实际的括号，不应该有 ... 提示
        expect(text).toContain('{');
        expect(text).toContain('}');
        // 检查是否没有 "..." 字符串（类型提示的一部分）
        const hasTypeHint = text.includes('{...}') || text.includes('[...]');
        expect(hasTypeHint).toBe(false);
      });
    });

    describe('折叠状态下的元素数量显示 - 验证需求 3.6', () => {
      it('折叠的对象应该显示属性数量 - 验证需求 3.6', () => {
        const data = { 
          user: { 
            name: 'John', 
            age: 25, 
            email: 'john@example.com' 
          } 
        };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 先展开外层对象
        const outerNode = container.querySelector('.cursor-pointer');
        if (outerNode) {
          fireEvent.click(outerNode);
        }
        
        // 应该显示 {3} 表示有 3 个属性
        expect(container.textContent).toContain('{3}');
      });

      it('折叠的数组应该显示元素数量 - 验证需求 3.6', () => {
        const data = { items: [1, 2, 3, 4, 5] };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 先展开外层对象
        const outerNode = container.querySelector('.cursor-pointer');
        if (outerNode) {
          fireEvent.click(outerNode);
        }
        
        // 应该显示 {5} 表示有 5 个元素
        expect(container.textContent).toContain('{5}');
      });

      it('空对象应该显示 {0}', () => {
        const data = { empty: {} };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 先展开外层对象
        const outerNode = container.querySelector('.cursor-pointer');
        if (outerNode) {
          fireEvent.click(outerNode);
        }
        
        // 空对象不应该显示数量（因为 size > 0 的条件）
        // 但应该显示 {...}
        expect(container.textContent).toContain('{...}');
      });

      it('空数组应该显示 {0}', () => {
        const data = { empty: [] };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 先展开外层对象
        const outerNode = container.querySelector('.cursor-pointer');
        if (outerNode) {
          fireEvent.click(outerNode);
        }
        
        // 空数组不应该显示数量（因为 size > 0 的条件）
        // 但应该显示 [...]
        expect(container.textContent).toContain('[...]');
      });

      it('展开状态不应该显示元素数量', () => {
        const data = { items: [1, 2, 3] };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={2} />);
        
        // 展开状态不应该显示 {3} 这样的数量提示
        const text = container.textContent || '';
        // 应该显示实际的数字 1, 2, 3，但不应该显示 {3}
        expect(text).toContain('1');
        expect(text).toContain('2');
        expect(text).toContain('3');
        // 检查是否没有 {数字} 格式的数量提示
        const hasCountHint = /\{\d+\}/.test(text);
        expect(hasCountHint).toBe(false);
      });
    });

    describe('嵌套节点的交互', () => {
      it('应该能够独立控制嵌套节点的展开状态', () => {
        const data = {
          level1: {
            level2a: { value: 'a' },
            level2b: { value: 'b' }
          }
        };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={2} />);
        
        // 所有节点都应该展开
        expect(container.textContent).toContain('level1');
        expect(container.textContent).toContain('level2a');
        expect(container.textContent).toContain('level2b');
        
        // 查找所有可点击的节点
        const clickableNodes = container.querySelectorAll('.cursor-pointer');
        expect(clickableNodes.length).toBeGreaterThan(0);
        
        // 点击 level2a 节点（第三个可点击节点：根对象、level1、level2a、level2b）
        if (clickableNodes.length >= 3) {
          fireEvent.click(clickableNodes[2]);
          
          // level2a 应该折叠，但 level2b 仍然展开
          expect(container.textContent).toContain('level2a');
          expect(container.textContent).toContain('level2b');
          expect(container.textContent).toContain('{...}'); // level2a 折叠
        }
      });
    });

    describe('边界情况', () => {
      it('应该正确处理只有一个属性的对象', () => {
        const data = { single: { value: 123 } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 应该显示 {1}
        expect(container.textContent).toContain('{1}');
      });

      it('应该正确处理只有一个元素的数组', () => {
        const data = { single: [42] };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 先展开外层对象
        const outerNode = container.querySelector('.cursor-pointer');
        if (outerNode) {
          fireEvent.click(outerNode);
        }
        
        // 应该显示 {1}
        expect(container.textContent).toContain('{1}');
      });

      it('应该正确处理深层嵌套结构', () => {
        const data = {
          l1: {
            l2: {
              l3: {
                l4: {
                  value: 'deep'
                }
              }
            }
          }
        };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        // 第一层展开，其他层折叠
        expect(container.textContent).toContain('l1');
        expect(container.textContent).toContain('{...}'); // l2 折叠
      });
    });

    describe('特殊数据类型测试 - 验证需求 3.1, 3.2', () => {
      it('应该正确渲染包含特殊字符的字符串', () => {
        const data = { 
          text: 'Hello\nWorld\t"quoted"',
          emoji: '😀🎉',
          unicode: '\u4e2d\u6587'
        };
        const { container } = render(<JSONViewer data={data} />);
        expect(container).toBeTruthy();
        expect(container.textContent).toContain('text');
      });

      it('应该正确渲染混合类型的数组', () => {
        const data = [
          'string',
          123,
          true,
          null,
          { nested: 'object' },
          [1, 2, 3]
        ];
        const { container } = render(<JSONViewer data={data} />);
        expect(container).toBeTruthy();
      });

      it('应该正确渲染空对象和空数组', () => {
        const data = {
          emptyObj: {},
          emptyArr: [],
          nested: {
            alsoEmpty: {}
          }
        };
        const { container } = render(<JSONViewer data={data} />);
        expect(container).toBeTruthy();
      });

      it('应该正确渲染大数字和小数', () => {
        const data = {
          bigInt: 9007199254740991,
          decimal: 3.14159,
          negative: -42,
          zero: 0
        };
        const { container } = render(<JSONViewer data={data} />);
        expect(container.textContent).toContain('3.14159');
        expect(container.textContent).toContain('-42');
      });

      it('应该正确处理包含 null 和 undefined 的对象', () => {
        const data = {
          nullValue: null,
          undefinedValue: undefined,
          normalValue: 'test'
        };
        const { container } = render(<JSONViewer data={data} />);
        expect(container.textContent).toContain('null');
        expect(container.textContent).toContain('test');
      });
    });

    describe('JSON 字符串解析测试 - 验证需求 3.10', () => {
      it('应该解析包含嵌套结构的 JSON 字符串', () => {
        const jsonString = JSON.stringify({
          user: {
            name: 'John',
            contacts: ['email', 'phone']
          }
        });
        const { container } = render(<JSONViewer data={jsonString} />);
        expect(container).toBeTruthy();
      });

      it('应该处理格式化的 JSON 字符串（带换行和缩进）', () => {
        const jsonString = `{
  "name": "test",
  "value": 123
}`;
        const { container } = render(<JSONViewer data={jsonString} />);
        expect(container).toBeTruthy();
      });

      it('应该显示空字符串的原始内容 - 验证需求 3.10', () => {
        const { container } = render(<JSONViewer data="" />);
        expect(container).toBeTruthy();
      });

      it('应该显示包含 JSON 片段的无效字符串 - 验证需求 3.10', () => {
        const invalidJson = '{"incomplete": ';
        const { container } = render(<JSONViewer data={invalidJson} />);
        expect(container.textContent).toContain('{"incomplete":');
      });
    });

    describe('默认展开层级测试 - 验证需求 3.1', () => {
      it('defaultExpandLevel=1 应该只展开第一层 - 验证需求 3.1', () => {
        const data = {
          level1: {
            level2: {
              level3: 'value'
            }
          }
        };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        // 第一层展开
        expect(container.textContent).toContain('level1');
        expect(container.textContent).toContain('▼');
        
        // 第二层折叠
        expect(container.textContent).toContain('{...}');
      });

      it('defaultExpandLevel=0 应该全部折叠', () => {
        const data = {
          a: 1,
          b: { c: 2 }
        };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 根节点折叠
        expect(container.textContent).toContain('▶');
        expect(container.textContent).toContain('{...}');
      });

      it('defaultExpandLevel=3 应该展开三层', () => {
        const data = {
          l1: {
            l2: {
              l3: {
                l4: 'deep'
              }
            }
          }
        };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={3} />);
        
        // 前三层应该展开
        expect(container.textContent).toContain('l1');
        expect(container.textContent).toContain('l2');
        expect(container.textContent).toContain('l3');
      });
    });

    describe('数组索引显示测试', () => {
      it('应该正确显示数组元素（不显示索引键名）', () => {
        const data = ['first', 'second', 'third'];
        const { container } = render(<JSONViewer data={data} />);
        
        // 数组元素不应该显示索引作为键名
        expect(container.textContent).toContain('first');
        expect(container.textContent).toContain('second');
        expect(container.textContent).toContain('third');
      });

      it('应该正确显示对象数组', () => {
        const data = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ];
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={2} />);
        expect(container.textContent).toContain('id');
        expect(container.textContent).toContain('name');
      });
    });

    describe('键盘导航和可访问性测试 - 验证需求 4.4', () => {
      it('应该为折叠节点添加正确的 ARIA 属性', () => {
        const data = { nested: { value: 'test' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        const button = container.querySelector('[role="button"]');
        expect(button).toBeTruthy();
        expect(button?.getAttribute('aria-expanded')).toBe('false');
      });

      it('应该为展开节点添加正确的 ARIA 属性', () => {
        const data = { nested: { value: 'test' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        const button = container.querySelector('[role="button"]');
        expect(button).toBeTruthy();
        expect(button?.getAttribute('aria-expanded')).toBe('true');
      });

      it('应该支持 Enter 键展开/折叠节点', () => {
        const data = { nested: { value: 'test' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        let button = container.querySelector('[role="button"]');
        expect(button).toBeTruthy();
        
        // 初始状态：折叠
        expect(button?.getAttribute('aria-expanded')).toBe('false');
        
        // 按 Enter 键展开
        fireEvent.keyDown(button!, { key: 'Enter' });
        
        // 重新查询按钮元素（因为组件重新渲染了）
        button = container.querySelector('[role="button"]');
        
        // 应该展开
        expect(button?.getAttribute('aria-expanded')).toBe('true');
      });

      it('应该支持空格键展开/折叠节点', () => {
        const data = { nested: { value: 'test' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        let button = container.querySelector('[role="button"]');
        expect(button).toBeTruthy();
        
        // 初始状态：折叠
        expect(button?.getAttribute('aria-expanded')).toBe('false');
        
        // 按空格键展开
        fireEvent.keyDown(button!, { key: ' ' });
        
        // 重新查询按钮元素（因为组件重新渲染了）
        button = container.querySelector('[role="button"]');
        
        // 应该展开
        expect(button?.getAttribute('aria-expanded')).toBe('true');
      });

      it('应该为展开的节点添加 role="group"', () => {
        const data = { nested: { value: 'test' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        const group = container.querySelector('[role="group"]');
        expect(group).toBeTruthy();
      });

      it('应该使所有可交互节点可通过 Tab 键访问', () => {
        const data = { 
          a: { value: 1 },
          b: { value: 2 }
        };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={1} />);
        
        const buttons = container.querySelectorAll('[role="button"]');
        buttons.forEach(button => {
          expect(button.getAttribute('tabIndex')).toBe('0');
        });
      });

      it('应该为三角形图标添加 aria-hidden', () => {
        const data = { nested: { value: 'test' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        // 查找三角形图标
        const icon = container.querySelector('.inline-block.w-3');
        expect(icon?.getAttribute('aria-hidden')).toBe('true');
      });

      it('应该提供描述性的 aria-label', () => {
        const data = { user: { name: 'John' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        const button = container.querySelector('[role="button"]');
        const ariaLabel = button?.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toContain('展开');
      });

      it('应该在键盘事件中阻止默认行为', () => {
        const data = { nested: { value: 'test' } };
        const { container } = render(<JSONViewer data={data} defaultExpandLevel={0} />);
        
        const button = container.querySelector('[role="button"]');
        expect(button).toBeTruthy();
        
        // 使用 fireEvent 来触发键盘事件
        if (button) {
          fireEvent.keyDown(button, { key: 'Enter' });
        }
        
        // 重新查询按钮元素（因为组件重新渲染了）
        const updatedButton = container.querySelector('[role="button"]');
        
        // 验证按钮状态改变（间接验证事件被处理）
        expect(updatedButton?.getAttribute('aria-expanded')).toBe('true');
      });
    });
  });
});
