/**
 * Resizer 组件单元测试
 * 
 * 测试可拖拽分隔条的交互功能：
 * - 鼠标悬停时光标变化
 * - 拖拽开始、移动、结束的完整流程
 * - 双击重置功能
 * - 边界值限制
 * 
 * 验证需求：1.1, 1.2, 1.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Resizer } from './Resizer';

// 辅助函数：等待 requestAnimationFrame 执行
const waitForRAF = async () => {
  await act(async () => {
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
  });
};

describe('Resizer 组件', () => {
  let onWidthChange: ReturnType<typeof vi.fn>;
  let onReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onWidthChange = vi.fn();
    onReset = vi.fn();

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    // Mock document.body.style
    Object.defineProperty(document.body, 'style', {
      writable: true,
      value: {
        userSelect: '',
        cursor: '',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染和样式', () => {
    it('应该渲染分隔条元素', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer).toBeDefined();
    });

    it('应该显示 col-resize 光标样式', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer.className).toContain('cursor-col-resize');
    });

    it('应该包含正确的 ARIA 属性', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer.getAttribute('aria-label')).toBe('调整详情面板宽度');
      expect(resizer.getAttribute('aria-orientation')).toBe('vertical');
      expect(resizer.getAttribute('aria-valuenow')).toBe('600');
      expect(resizer.getAttribute('aria-valuemin')).toBe('300');
      expect(resizer.getAttribute('aria-valuemax')).toBe('1200');
    });

    it('应该在未提供 maxWidth 时使用窗口宽度的 80% 作为最大值', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
        />
      );

      const resizer = screen.getByRole('separator');
      // 80% of 1920 = 1536
      expect(resizer.getAttribute('aria-valuemax')).toBe('1536');
    });

    it('应该显示提示文本', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer.getAttribute('title')).toBe('拖拽调整宽度，双击或按 Enter 重置，使用左右箭头键微调');
    });
  });

  describe('拖拽功能', () => {
    it('应该在鼠标按下时开始拖拽', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 验证全局样式已设置
      expect(document.body.style.userSelect).toBe('none');
      expect(document.body.style.cursor).toBe('col-resize');
    });

    it('应该在拖拽过程中更新宽度', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 向左拖拽 100px（面板宽度增加）
      fireEvent.mouseMove(document, { clientX: 900 });

      // 等待 requestAnimationFrame 执行
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      });

      // 应该调用 onWidthChange，宽度增加 100px
      expect(onWidthChange).toHaveBeenCalledWith(700);
    });

    it('应该在拖拽过程中持续更新宽度', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 第一次移动
      fireEvent.mouseMove(document, { clientX: 950 });
      await waitForRAF();
      expect(onWidthChange).toHaveBeenCalledWith(650);

      // 第二次移动
      fireEvent.mouseMove(document, { clientX: 900 });
      await waitForRAF();
      expect(onWidthChange).toHaveBeenCalledWith(700);

      // 第三次移动
      fireEvent.mouseMove(document, { clientX: 850 });
      await waitForRAF();
      expect(onWidthChange).toHaveBeenCalledWith(750);
    });

    it('应该在鼠标释放时结束拖拽', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });
      expect(document.body.style.userSelect).toBe('none');

      // 移动
      fireEvent.mouseMove(document, { clientX: 900 });

      // 结束拖拽
      fireEvent.mouseUp(document);

      // 验证全局样式已清除
      expect(document.body.style.userSelect).toBe('');
      expect(document.body.style.cursor).toBe('');
    });

    it('应该在结束拖拽后不再响应鼠标移动', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });
      fireEvent.mouseMove(document, { clientX: 900 });
      await waitForRAF();
      
      const callCountDuringDrag = onWidthChange.mock.calls.length;

      // 结束拖拽
      fireEvent.mouseUp(document);

      // 再次移动鼠标
      fireEvent.mouseMove(document, { clientX: 800 });
      await waitForRAF();

      // 不应该再调用 onWidthChange
      expect(onWidthChange).toHaveBeenCalledTimes(callCountDuringDrag);
    });

    it('应该在未开始拖拽时不响应鼠标移动', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      // 直接移动鼠标（未按下）
      fireEvent.mouseMove(document, { clientX: 900 });

      // 不应该调用 onWidthChange
      expect(onWidthChange).not.toHaveBeenCalled();
    });
  });

  describe('边界约束', () => {
    it('应该限制宽度不小于最小值', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 向右拖拽很远（尝试将宽度减小到小于 minWidth）
      fireEvent.mouseMove(document, { clientX: 1500 });
      await waitForRAF();

      // 应该被限制为 minWidth
      expect(onWidthChange).toHaveBeenCalledWith(300);
    });

    it('应该限制宽度不大于最大值', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 向左拖拽很远（尝试将宽度增加到大于 maxWidth）
      fireEvent.mouseMove(document, { clientX: 200 });
      await waitForRAF();

      // 应该被限制为 maxWidth
      expect(onWidthChange).toHaveBeenCalledWith(1200);
    });

    it('应该在未提供 maxWidth 时使用窗口宽度的 80% 作为限制', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 向左拖拽很远
      fireEvent.mouseMove(document, { clientX: 0 });
      await waitForRAF();

      // 应该被限制为窗口宽度的 80%（1920 * 0.8 = 1536）
      expect(onWidthChange).toHaveBeenCalledWith(1536);
    });

    it('应该接受在边界内的宽度值', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 向左拖拽 200px（宽度变为 800，在边界内）
      fireEvent.mouseMove(document, { clientX: 800 });
      await waitForRAF();

      // 应该接受这个值
      expect(onWidthChange).toHaveBeenCalledWith(800);
    });
  });

  describe('双击重置功能', () => {
    it('应该在双击时调用 onReset 回调', () => {
      render(
        <Resizer
          width={800}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
          onReset={onReset}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 双击分隔条
      fireEvent.doubleClick(resizer);

      // 应该调用 onReset
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('应该在未提供 onReset 时不抛出错误', () => {
      render(
        <Resizer
          width={800}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 双击分隔条（不应该抛出错误）
      expect(() => {
        fireEvent.doubleClick(resizer);
      }).not.toThrow();
    });
  });

  describe('默认值', () => {
    it('应该使用默认的 minWidth (300)', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer.getAttribute('aria-valuemin')).toBe('300');
    });

    it('应该在未提供 minWidth 时正确约束宽度', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 尝试将宽度减小到小于默认 minWidth (300)
      fireEvent.mouseMove(document, { clientX: 1500 });
      await waitForRAF();

      // 应该被限制为默认 minWidth
      expect(onWidthChange).toHaveBeenCalledWith(300);
    });
  });

  describe('拖拽方向', () => {
    it('应该正确处理向左拖拽（增加宽度）', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 向左移动 50px
      fireEvent.mouseMove(document, { clientX: 950 });
      await waitForRAF();

      // 宽度应该增加 50px
      expect(onWidthChange).toHaveBeenCalledWith(650);
    });

    it('应该正确处理向右拖拽（减小宽度）', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 向右移动 50px
      fireEvent.mouseMove(document, { clientX: 1050 });
      await waitForRAF();

      // 宽度应该减小 50px
      expect(onWidthChange).toHaveBeenCalledWith(550);
    });
  });

  describe('事件处理', () => {
    it('应该阻止 mouseDown 的默认行为', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 1000,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      resizer.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('应该在 document 级别监听 mousemove 事件', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      // 应该注册 mousemove 监听器
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
    });

    it('应该在 document 级别监听 mouseup 事件', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      // 应该注册 mouseup 监听器
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );
    });

    it('应该在组件卸载时清理事件监听器', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      unmount();

      // 应该移除 mousemove 监听器
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );

      // 应该移除 mouseup 监听器
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );
    });
  });

  describe('边缘情况', () => {
    it('应该处理宽度为 0 的情况', () => {
      render(
        <Resizer
          width={0}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer.getAttribute('aria-valuenow')).toBe('0');
    });

    it('应该处理负数宽度的情况', () => {
      render(
        <Resizer
          width={-100}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer.getAttribute('aria-valuenow')).toBe('-100');
    });

    it('应该处理非常大的宽度值', () => {
      render(
        <Resizer
          width={10000}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={15000}
        />
      );

      const resizer = screen.getByRole('separator');
      expect(resizer.getAttribute('aria-valuenow')).toBe('10000');
    });

    it('应该处理 minWidth 大于 maxWidth 的情况', async () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={1000}
          maxWidth={500}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1000 });

      // 尝试调整宽度
      fireEvent.mouseMove(document, { clientX: 900 });
      await waitForRAF();

      // 应该被限制为 maxWidth（即使它小于 minWidth）
      // 实际上 Math.max(minWidth, Math.min(newWidth, maxWidth)) 会优先使用 minWidth
      expect(onWidthChange).toHaveBeenCalledWith(1000);
    });
  });

  describe('键盘导航', () => {
    it('应该支持左箭头键增加宽度', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 按左箭头键
      fireEvent.keyDown(resizer, { key: 'ArrowLeft' });

      // 宽度应该增加 10px
      expect(onWidthChange).toHaveBeenCalledWith(610);
    });

    it('应该支持右箭头键减小宽度', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 按右箭头键
      fireEvent.keyDown(resizer, { key: 'ArrowRight' });

      // 宽度应该减小 10px
      expect(onWidthChange).toHaveBeenCalledWith(590);
    });

    it('应该支持 Enter 键重置宽度', () => {
      render(
        <Resizer
          width={800}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
          onReset={onReset}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 按 Enter 键
      fireEvent.keyDown(resizer, { key: 'Enter' });

      // 应该调用 onReset
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('应该在键盘调整时遵守边界约束', () => {
      render(
        <Resizer
          width={305}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 按右箭头键多次，尝试超出最小值
      fireEvent.keyDown(resizer, { key: 'ArrowRight' }); // 295 -> 限制为 300
      
      // 应该被限制为 minWidth
      expect(onWidthChange).toHaveBeenCalledWith(300);
    });

    it('应该在未提供 onReset 时不抛出错误', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 按 Enter 键（不应该抛出错误）
      expect(() => {
        fireEvent.keyDown(resizer, { key: 'Enter' });
      }).not.toThrow();
    });

    it('应该使 Resizer 可通过 Tab 键访问', () => {
      render(
        <Resizer
          width={600}
          onWidthChange={onWidthChange}
          minWidth={300}
          maxWidth={1200}
        />
      );

      const resizer = screen.getByRole('separator');
      
      // 应该有 tabIndex 属性
      expect(resizer.getAttribute('tabIndex')).toBe('0');
    });
  });
});
