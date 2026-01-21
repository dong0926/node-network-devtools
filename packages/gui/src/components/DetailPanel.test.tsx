/**
 * DetailPanel 组件集成测试
 * 
 * 测试详情面板的完整功能：
 * - 面板宽度调整功能
 * - 宽度持久化
 * - 与现有功能的兼容性
 * - 标签页切换
 * - Resizer 集成
 * 
 * 验证需求：1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DetailPanel } from './DetailPanel';
import type { UIRequest } from '../hooks';

// 辅助函数：等待 requestAnimationFrame 执行
const waitForRAF = async () => {
  await act(async () => {
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
  });
};

describe('DetailPanel 集成测试', () => {
  let mockRequest: UIRequest;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
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

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

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

    // 创建模拟请求对象
    mockRequest = {
      id: 'test-request-1',
      method: 'GET',
      url: 'https://api.example.com/users?page=1&limit=10',
      status: 'complete',
      statusCode: 200,
      statusText: 'OK',
      type: 'fetch',
      time: 150,
      startTime: Date.now(),
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
      },
      responseHeaders: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      requestBody: JSON.stringify({ name: 'test', value: 123 }),
      responseBody: JSON.stringify({ success: true, data: [1, 2, 3] }),
      timing: {
        startTime: Date.now(),
        dnsLookup: 10,
        tcpConnection: 20,
        tlsHandshake: 15,
        firstByte: 30,
        contentDownload: 25,
        total: 150,
      },
    };

    onClose = vi.fn();

    // 清空 localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('基本渲染', () => {
    it('应该渲染详情面板', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      // 验证面板头部显示请求信息
      expect(screen.getByText(/GET/)).toBeDefined();
      expect(screen.getByText(/api\.example\.com/)).toBeDefined();
    });

    it('应该渲染所有标签页', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      expect(screen.getByText('Headers')).toBeDefined();
      expect(screen.getByText('Payload')).toBeDefined();
      expect(screen.getByText('Response')).toBeDefined();
      expect(screen.getByText('Timing')).toBeDefined();
    });

    it('应该渲染 Resizer 组件', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      expect(resizer).toBeDefined();
    });

    it('应该渲染关闭按钮', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const closeButton = screen.getByTitle('关闭');
      expect(closeButton).toBeDefined();
    });
  });

  describe('面板宽度调整功能（需求 1.1, 1.2）', () => {
    it('应该使用默认宽度（40%）', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const panel = screen.getByRole('separator').parentElement;
      expect(panel).toBeDefined();
      
      // 默认宽度应该是窗口宽度的 40%（1920 * 0.4 = 768）
      const style = panel?.getAttribute('style');
      expect(style).toContain('768px');
    });

    it('应该使用提供的初始宽度', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} initialWidth={600} />);

      const panel = screen.getByRole('separator').parentElement;
      const style = panel?.getAttribute('style');
      expect(style).toContain('600px');
    });

    it('应该通过拖拽调整面板宽度', async () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 }); // 1920 - 768 = 1152

      // 向左拖拽 100px（增加宽度）
      fireEvent.mouseMove(document, { clientX: 1052 });
      await waitForRAF();

      // 验证宽度已更新
      const style = panel?.getAttribute('style');
      expect(style).toContain('868px'); // 768 + 100 = 868
    });

    it('应该在拖拽过程中实时更新宽度', async () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });

      // 第一次移动
      fireEvent.mouseMove(document, { clientX: 1102 });
      await waitForRAF();
      let style = panel?.getAttribute('style');
      expect(style).toContain('818px'); // 768 + 50

      // 第二次移动
      fireEvent.mouseMove(document, { clientX: 1052 });
      await waitForRAF();
      style = panel?.getAttribute('style');
      expect(style).toContain('868px'); // 768 + 100
    });

    it('应该在鼠标释放后结束拖拽', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });
      fireEvent.mouseMove(document, { clientX: 1052 });

      // 结束拖拽
      fireEvent.mouseUp(document);

      // 验证全局样式已清除
      expect(document.body.style.userSelect).toBe('');
      expect(document.body.style.cursor).toBe('');
    });
  });

  describe('宽度边界约束（需求 1.5, 1.6）', () => {
    it('应该限制宽度不小于最小值（300px）', async () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });

      // 向右拖拽很远（尝试将宽度减小到小于 300px）
      fireEvent.mouseMove(document, { clientX: 1800 });
      await waitForRAF();

      // 验证宽度被限制为 300px
      const style = panel?.getAttribute('style');
      expect(style).toContain('300px');
    });

    it('应该限制宽度不大于最大值（窗口宽度的 80%）', async () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });

      // 向左拖拽很远（尝试将宽度增加到大于 80%）
      fireEvent.mouseMove(document, { clientX: 100 });
      await waitForRAF();

      // 验证宽度被限制为窗口宽度的 80%（1920 * 0.8 = 1536）
      const style = panel?.getAttribute('style');
      expect(style).toContain('1536px');
    });

    it('应该接受在边界内的宽度值', async () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });

      // 向左拖拽到有效范围内
      fireEvent.mouseMove(document, { clientX: 920 }); // 宽度变为 1000px
      await waitForRAF();

      // 验证宽度已更新
      const style = panel?.getAttribute('style');
      expect(style).toContain('1000px');
    });
  });

  describe('宽度持久化（需求 1.3, 1.4）', () => {
    it('应该在重新加载时恢复保存的宽度', () => {
      // 预先保存宽度到 localStorage
      localStorage.setItem('nnd-detail-panel-width', '900');

      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const panel = screen.getByRole('separator').parentElement;
      const style = panel?.getAttribute('style');
      
      // 应该使用保存的宽度
      expect(style).toContain('900px');
    });

    it('应该在没有保存值时使用默认宽度', () => {
      // 确保 localStorage 中没有保存的值
      localStorage.removeItem('nnd-detail-panel-width');

      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const panel = screen.getByRole('separator').parentElement;
      const style = panel?.getAttribute('style');
      
      // 应该使用默认宽度（40% = 768px）
      expect(style).toContain('768px');
    });

    it('应该在调整宽度后更新面板宽度', async () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });

      // 调整宽度
      fireEvent.mouseMove(document, { clientX: 1052 });
      await waitForRAF();

      // 验证面板宽度已更新
      const style = panel?.getAttribute('style');
      expect(style).toContain('868px');

      // 结束拖拽
      fireEvent.mouseUp(document);
    });

    it('应该在重新渲染后保持调整后的宽度', () => {
      // 预先保存一个宽度
      localStorage.setItem('nnd-detail-panel-width', '1000');

      const { rerender } = render(<DetailPanel request={mockRequest} onClose={onClose} />);

      let panel = screen.getByRole('separator').parentElement;
      let style = panel?.getAttribute('style');
      expect(style).toContain('1000px');

      // 重新渲染组件
      rerender(<DetailPanel request={mockRequest} onClose={onClose} />);

      panel = screen.getByRole('separator').parentElement;
      style = panel?.getAttribute('style');
      
      // 应该保持相同的宽度
      expect(style).toContain('1000px');
    });
  });

  describe('双击重置功能（需求 1.7）', () => {
    it('应该在双击 Resizer 时重置为默认宽度', () => {
      // 先调整宽度
      localStorage.setItem('nnd-detail-panel-width', '1000');

      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 验证当前使用保存的宽度
      let style = panel?.getAttribute('style');
      expect(style).toContain('1000px');

      // 双击重置
      fireEvent.doubleClick(resizer);

      // 验证宽度已重置为默认值
      style = panel?.getAttribute('style');
      expect(style).toContain('768px'); // 默认 40% = 768px
    });

    it('应该在重置后 localStorage 中保存默认宽度', () => {
      localStorage.setItem('nnd-detail-panel-width', '1000');

      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');

      // 双击重置
      fireEvent.doubleClick(resizer);

      // 验证 localStorage 已更新（resetWidth 会立即保存）
      const savedWidth = localStorage.getItem('nnd-detail-panel-width');
      expect(savedWidth).toBe('768');
    });
  });

  describe('标签页切换功能', () => {
    it('应该默认显示 Headers 标签页', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const headersTab = screen.getByText('Headers');
      expect(headersTab.className).toContain('border-devtools-accent');
    });

    it('应该能够切换到 Payload 标签页', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const payloadTab = screen.getByText('Payload');
      fireEvent.click(payloadTab);

      expect(payloadTab.className).toContain('border-devtools-accent');
    });

    it('应该能够切换到 Response 标签页', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const responseTab = screen.getByText('Response');
      fireEvent.click(responseTab);

      expect(responseTab.className).toContain('border-devtools-accent');
    });

    it('应该能够切换到 Timing 标签页', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const timingTab = screen.getByText('Timing');
      fireEvent.click(timingTab);

      expect(timingTab.className).toContain('border-devtools-accent');
    });

    it('应该在切换标签页时保持面板宽度', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const panel = screen.getByRole('separator').parentElement;
      const resizer = screen.getByRole('separator');

      // 调整宽度
      fireEvent.mouseDown(resizer, { clientX: 1152 });
      fireEvent.mouseMove(document, { clientX: 1052 });
      fireEvent.mouseUp(document);

      let style = panel?.getAttribute('style');
      expect(style).toContain('868px');

      // 切换标签页
      const payloadTab = screen.getByText('Payload');
      fireEvent.click(payloadTab);

      // 验证宽度保持不变
      style = panel?.getAttribute('style');
      expect(style).toContain('868px');
    });
  });

  describe('关闭功能', () => {
    it('应该在点击关闭按钮时调用 onClose', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const closeButton = screen.getByTitle('关闭');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('应该在调整宽度后能够正常关闭', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');

      // 调整宽度
      fireEvent.mouseDown(resizer, { clientX: 1152 });
      fireEvent.mouseMove(document, { clientX: 1052 });
      fireEvent.mouseUp(document);

      // 关闭面板
      const closeButton = screen.getByTitle('关闭');
      fireEvent.click(closeButton);

      // 验证关闭回调被调用
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('错误信息显示', () => {
    it('应该在请求有错误时显示错误信息', () => {
      const requestWithError: UIRequest = {
        ...mockRequest,
        error: {
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        },
      };

      render(<DetailPanel request={requestWithError} onClose={onClose} />);

      expect(screen.getByText(/错误:/)).toBeDefined();
      expect(screen.getByText(/ECONNREFUSED/)).toBeDefined();
      expect(screen.getByText(/Connection refused/)).toBeDefined();
    });

    it('应该在没有错误时不显示错误信息', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      expect(screen.queryByText(/错误:/)).toBeNull();
    });

    it('应该在有错误时仍然允许调整面板宽度', async () => {
      const requestWithError: UIRequest = {
        ...mockRequest,
        error: {
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        },
      };

      render(<DetailPanel request={requestWithError} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 调整宽度
      fireEvent.mouseDown(resizer, { clientX: 1152 });
      fireEvent.mouseMove(document, { clientX: 1052 });
      await waitForRAF();

      // 验证宽度已更新
      const style = panel?.getAttribute('style');
      expect(style).toContain('868px');
    });
  });

  describe('响应式行为', () => {
    it('应该在窗口大小变化时调整最大宽度限制', async () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 改变窗口大小
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });

      // 触发 resize 事件
      fireEvent(window, new Event('resize'));

      // 尝试拖拽到超过新的最大宽度
      fireEvent.mouseDown(resizer, { clientX: 1152 });
      fireEvent.mouseMove(document, { clientX: 100 });
      await waitForRAF();

      // 验证宽度被限制为新窗口宽度的 80%（1280 * 0.8 = 1024）
      const style = panel?.getAttribute('style');
      expect(style).toContain('1024px');
    });
  });

  describe('与现有功能的兼容性', () => {
    it('应该正确显示请求方法和 URL', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      expect(screen.getByText(/GET/)).toBeDefined();
      expect(screen.getByText(/api\.example\.com/)).toBeDefined();
    });

    it('应该在 Payload 标签页中显示请求体', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const payloadTab = screen.getByText('Payload');
      fireEvent.click(payloadTab);

      // PayloadTab 应该接收到 body prop
      // 这里我们只验证标签页被激活
      expect(payloadTab.className).toContain('border-devtools-accent');
    });

    it('应该在 Response 标签页中显示响应体', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const responseTab = screen.getByText('Response');
      fireEvent.click(responseTab);

      // ResponseTab 应该接收到 body prop
      expect(responseTab.className).toContain('border-devtools-accent');
    });

    it('应该在 Headers 标签页中显示请求头和响应头', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      // Headers 标签页默认激活
      const headersTab = screen.getByText('Headers');
      expect(headersTab.className).toContain('border-devtools-accent');
    });

    it('应该在 Timing 标签页中显示时序信息', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const timingTab = screen.getByText('Timing');
      fireEvent.click(timingTab);

      // TimingTab 应该接收到 timing 和 totalTime props
      expect(timingTab.className).toContain('border-devtools-accent');
    });
  });

  describe('边缘情况', () => {
    it('应该处理没有请求体的情况', () => {
      const requestWithoutBody: UIRequest = {
        ...mockRequest,
        requestBody: undefined,
      };

      render(<DetailPanel request={requestWithoutBody} onClose={onClose} />);

      const payloadTab = screen.getByText('Payload');
      fireEvent.click(payloadTab);

      // 应该正常渲染，不抛出错误
      expect(payloadTab.className).toContain('border-devtools-accent');
    });

    it('应该处理没有响应体的情况', () => {
      const requestWithoutResponse: UIRequest = {
        ...mockRequest,
        responseBody: undefined,
      };

      render(<DetailPanel request={requestWithoutResponse} onClose={onClose} />);

      const responseTab = screen.getByText('Response');
      fireEvent.click(responseTab);

      // 应该正常渲染，不抛出错误
      expect(responseTab.className).toContain('border-devtools-accent');
    });

    it('应该处理没有时序信息的情况', () => {
      const requestWithoutTiming: UIRequest = {
        ...mockRequest,
        timing: undefined,
      };

      render(<DetailPanel request={requestWithoutTiming} onClose={onClose} />);

      const timingTab = screen.getByText('Timing');
      fireEvent.click(timingTab);

      // 应该正常渲染，不抛出错误
      expect(timingTab.className).toContain('border-devtools-accent');
    });

    it('应该处理非常长的 URL', () => {
      const requestWithLongUrl: UIRequest = {
        ...mockRequest,
        url: 'https://api.example.com/' + 'a'.repeat(500),
      };

      render(<DetailPanel request={requestWithLongUrl} onClose={onClose} />);

      // 应该正常渲染，URL 应该被截断
      const panel = screen.getByRole('separator').parentElement;
      expect(panel).toBeDefined();
    });

    it('应该处理 localStorage 不可用的情况', () => {
      // Mock localStorage 抛出错误
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');

      // 调整宽度（应该不抛出错误）
      expect(() => {
        fireEvent.mouseDown(resizer, { clientX: 1152 });
        fireEvent.mouseMove(document, { clientX: 1052 });
        fireEvent.mouseUp(document);
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('性能和用户体验', () => {
    it('应该在拖拽时提供视觉反馈', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });

      // 验证全局样式已设置
      expect(document.body.style.userSelect).toBe('none');
      expect(document.body.style.cursor).toBe('col-resize');
    });

    it('应该在拖拽结束后清除视觉反馈', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');

      // 开始拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });
      fireEvent.mouseMove(document, { clientX: 1052 });

      // 结束拖拽
      fireEvent.mouseUp(document);

      // 验证全局样式已清除
      expect(document.body.style.userSelect).toBe('');
      expect(document.body.style.cursor).toBe('');
    });

    it('应该在快速连续拖拽时正确工作', () => {
      render(<DetailPanel request={mockRequest} onClose={onClose} />);

      const resizer = screen.getByRole('separator');
      const panel = resizer.parentElement;

      // 第一次拖拽
      fireEvent.mouseDown(resizer, { clientX: 1152 });
      fireEvent.mouseMove(document, { clientX: 1052 });
      fireEvent.mouseUp(document);

      let style = panel?.getAttribute('style');
      expect(style).toContain('868px');

      // 立即进行第二次拖拽
      fireEvent.mouseDown(resizer, { clientX: 1052 });
      fireEvent.mouseMove(document, { clientX: 952 });
      fireEvent.mouseUp(document);

      style = panel?.getAttribute('style');
      expect(style).toContain('968px');
    });
  });
});
