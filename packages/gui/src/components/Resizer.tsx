/**
 * 可拖拽的分隔条组件，用于调整面板宽度
 */

import { useCallback, useEffect, useRef } from 'react';

interface ResizerProps {
  /** 当前宽度（像素） */
  width: number;
  /** 宽度变化回调 */
  onWidthChange: (width: number) => void;
  /** 最小宽度（像素），默认 300 */
  minWidth?: number;
  /** 最大宽度（像素），默认为窗口宽度的 80% */
  maxWidth?: number;
  /** 双击重置回调 */
  onReset?: () => void;
  /** 拖拽开始回调 */
  onDragStart?: () => void;
  /** 拖拽结束回调 */
  onDragEnd?: () => void;
}

/**
 * 可拖拽的分隔条组件
 * 
 * 功能：
 * - 鼠标悬停时显示 col-resize 光标
 * - 拖拽调整面板宽度
 * - 双击重置为默认宽度
 * - 拖拽时防止文本选择
 */
export function Resizer({
  width,
  onWidthChange,
  minWidth = 300,
  maxWidth,
  onReset,
  onDragStart,
  onDragEnd,
}: ResizerProps) {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // 约束宽度在最小值和最大值之间
  const constrainWidth = useCallback(
    (newWidth: number): number => {
      const effectiveMaxWidth = maxWidth ?? window.innerWidth * 0.8;
      return Math.max(minWidth, Math.min(newWidth, effectiveMaxWidth));
    },
    [minWidth, maxWidth]
  );

  // 处理鼠标按下事件，开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      // 添加全局样式防止文本选择
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      // 通知拖拽开始
      if (onDragStart) {
        onDragStart();
      }
    },
    [width, onDragStart]
  );

  // 处理双击事件，重置宽度
  const handleDoubleClick = useCallback(() => {
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  // 处理键盘事件，支持左右箭头键调整宽度
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newWidth = constrainWidth(width + 10);
        onWidthChange(newWidth);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newWidth = constrainWidth(width - 10);
        onWidthChange(newWidth);
      } else if (e.key === 'Enter' && onReset) {
        e.preventDefault();
        onReset();
      }
    },
    [width, constrainWidth, onWidthChange, onReset]
  );

  // 处理鼠标移动事件，更新宽度
  useEffect(() => {
    let rafId: number | null = null;
    let pendingWidth: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // 计算鼠标移动的距离（向左移动为正，因为面板在右侧）
      const deltaX = startXRef.current - e.clientX;
      const newWidth = startWidthRef.current + deltaX;
      const constrainedWidth = constrainWidth(newWidth);

      // 存储待更新的宽度
      pendingWidth = constrainedWidth;

      // 如果没有待处理的动画帧，请求一个新的
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (pendingWidth !== null) {
            onWidthChange(pendingWidth);
            pendingWidth = null;
          }
          rafId = null;
        });
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;

        // 取消待处理的动画帧
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        // 如果有待更新的宽度，立即应用
        if (pendingWidth !== null) {
          onWidthChange(pendingWidth);
          pendingWidth = null;
        }

        // 移除全局样式
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        // 通知拖拽结束
        if (onDragEnd) {
          onDragEnd();
        }
      }
    };

    // 在 document 级别监听，确保即使鼠标移出窗口也能正确处理
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 清理待处理的动画帧
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [constrainWidth, onWidthChange]);

  return (
    <div
      className="relative w-[1px] h-full cursor-col-resize hover:bg-devtools-accent bg-devtools-border transition-colors flex-shrink-0 group"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      role="separator"
      tabIndex={0}
      aria-label="调整详情面板宽度"
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth ?? window.innerWidth * 0.8}
      title="拖拽调整宽度，双击或按 Enter 重置，使用左右箭头键微调"
    >
      {/* 扩大的点击区域：左右各扩展 4px */}
      <div className="absolute inset-y-0 -left-[4px] -right-[4px] z-10" />
      
      {/* 悬停时的视觉指示器 */}
      <div className="absolute inset-y-0 -left-[0.5px] -right-[0.5px] bg-devtools-accent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
