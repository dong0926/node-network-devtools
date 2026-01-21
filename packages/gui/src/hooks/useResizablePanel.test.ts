/**
 * useResizablePanel Hook 单元测试
 * 
 * 测试面板宽度管理、边界约束、localStorage 持久化和窗口大小变化处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useResizablePanel } from './useResizablePanel';

// Mock localStorage
const localStorageMock = (() => {
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
})();

describe('useResizablePanel', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    // 清理之前的测试
    cleanup();
    vi.clearAllMocks();
    
    // 设置 localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    localStorageMock.clear();

    // 设置 window.innerWidth（不覆盖整个 window 对象）
    Object.defineProperty(window, 'innerWidth', {
      value: 1920,
      writable: true,
      configurable: true,
    });

    // Spy on window event listeners
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  describe('初始化', () => {
    it('应该使用默认宽度初始化（像素值）', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      expect(result.current.width).toBe(600);
    });

    it('应该使用默认宽度初始化（百分比值）', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: '40%',
          minWidth: 300,
          maxWidth: '80%',
          storageKey: 'test-panel-width',
        })
      );

      // 40% of 1920 = 768
      expect(result.current.width).toBe(768);
    });

    it('应该从 localStorage 加载保存的宽度', () => {
      localStorageMock.setItem('test-panel-width', '800');

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      expect(result.current.width).toBe(800);
    });

    it('应该在 localStorage 值无效时使用默认宽度', () => {
      localStorageMock.setItem('test-panel-width', 'invalid');

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      expect(result.current.width).toBe(600);
    });

    it('应该初始化为非拖拽状态', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('边界约束', () => {
    it('应该限制宽度不小于最小值', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(200); // 小于 minWidth
      });

      expect(result.current.width).toBe(300);
    });

    it('应该限制宽度不大于最大值（像素）', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(1500); // 大于 maxWidth
      });

      expect(result.current.width).toBe(1200);
    });

    it('应该限制宽度不大于最大值（百分比）', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: '80%', // 80% of 1920 = 1536
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(1600); // 大于 maxWidth
      });

      expect(result.current.width).toBe(1536);
    });

    it('应该接受在边界内的宽度值', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(800);
      });

      expect(result.current.width).toBe(800);
    });

    it('从 localStorage 加载的宽度应该受边界约束', () => {
      localStorageMock.setItem('test-panel-width', '2000'); // 超过 maxWidth

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      expect(result.current.width).toBe(1200);
    });
  });

  describe('宽度设置', () => {
    it('setWidth 应该更新宽度', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(800);
      });

      expect(result.current.width).toBe(800);
    });

    it('setWidth 应该标记宽度待保存（不立即保存）', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(800);
      });

      // 在拖拽过程中不应该立即保存
      // 只有在 stopDragging 后才保存
      expect(result.current.width).toBe(800);
    });
  });

  describe('重置宽度', () => {
    it('resetWidth 应该恢复默认宽度', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(800);
      });

      expect(result.current.width).toBe(800);

      act(() => {
        result.current.resetWidth();
      });

      expect(result.current.width).toBe(600);
    });

    it('resetWidth 应该保存默认宽度到 localStorage', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(800);
        result.current.resetWidth();
      });

      expect(localStorageMock.getItem('test-panel-width')).toBe('600');
    });
  });

  describe('拖拽状态管理', () => {
    it('startDragging 应该设置拖拽状态为 true', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      expect(result.current.isDragging).toBe(false);

      act(() => {
        result.current.startDragging();
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('stopDragging 应该设置拖拽状态为 false', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.startDragging();
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.stopDragging();
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('stopDragging 应该保存宽度到 localStorage', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.startDragging();
        result.current.setWidth(800);
        result.current.stopDragging();
      });

      expect(localStorageMock.getItem('test-panel-width')).toBe('800');
    });
  });

  describe('localStorage 错误处理', () => {
    it('应该在 localStorage 不可用时优雅降级', () => {
      // Mock localStorage 抛出错误
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = () => {
        throw new Error('localStorage not available');
      };

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      // 应该使用默认宽度，不抛出错误
      expect(result.current.width).toBe(600);

      // 恢复 mock
      localStorageMock.getItem = originalGetItem;
    });

    it('应该在 localStorage.setItem 失败时继续工作', () => {
      // Mock localStorage.setItem 抛出错误
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('localStorage quota exceeded');
      };

      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      // 应该能够设置宽度，即使保存失败
      act(() => {
        result.current.setWidth(800);
        result.current.stopDragging();
      });

      expect(result.current.width).toBe(800);

      // 恢复 mock
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('窗口大小变化', () => {
    it('应该注册窗口 resize 事件监听器', () => {
      renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: '80%',
          storageKey: 'test-panel-width',
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('应该在卸载时移除窗口 resize 事件监听器', () => {
      const { unmount } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: '80%',
          storageKey: 'test-panel-width',
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('百分比值处理', () => {
    it('应该正确解析百分比默认宽度', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: '50%',
          minWidth: 300,
          maxWidth: 1500,
          storageKey: 'test-panel-width',
        })
      );

      // 50% of 1920 = 960
      expect(result.current.width).toBe(960);
    });

    it('应该正确解析百分比最大宽度', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 600,
          minWidth: 300,
          maxWidth: '70%', // 70% of 1920 = 1344
          storageKey: 'test-panel-width',
        })
      );

      act(() => {
        result.current.setWidth(1400);
      });

      expect(result.current.width).toBe(1344);
    });

    it('应该处理无效的百分比字符串', () => {
      const { result } = renderHook(() =>
        useResizablePanel({
          defaultWidth: 'invalid%',
          minWidth: 300,
          maxWidth: 1200,
          storageKey: 'test-panel-width',
        })
      );

      // 应该回退到 minWidth
      expect(result.current.width).toBe(300);
    });
  });
});
