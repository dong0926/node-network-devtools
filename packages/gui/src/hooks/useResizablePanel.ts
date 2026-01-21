/**
 * 可调整大小面板 Hook
 * 
 * 管理面板宽度状态，支持拖拽调整、边界约束和 localStorage 持久化
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook 配置选项
 */
export interface UseResizablePanelOptions {
  /** 默认宽度（像素或百分比字符串，如 "40%"） */
  defaultWidth: number | string;
  /** 最小宽度（像素） */
  minWidth: number;
  /** 最大宽度（像素或百分比字符串，如 "80%"） */
  maxWidth: number | string;
  /** localStorage 存储键名 */
  storageKey: string;
}

/**
 * Hook 返回值
 */
export interface UseResizablePanelReturn {
  /** 当前宽度（像素） */
  width: number;
  /** 设置宽度 */
  setWidth: (width: number) => void;
  /** 重置为默认宽度 */
  resetWidth: () => void;
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 开始拖拽 */
  startDragging: () => void;
  /** 结束拖拽 */
  stopDragging: () => void;
}

/**
 * 将百分比或像素值转换为像素数值
 */
function parseWidth(value: number | string, windowWidth: number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  // 处理百分比字符串，如 "40%"
  if (typeof value === 'string' && value.endsWith('%')) {
    const percentage = parseFloat(value);
    if (!isNaN(percentage)) {
      return Math.round((windowWidth * percentage) / 100);
    }
  }
  
  // 尝试解析为数字
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 约束宽度在最小值和最大值之间
 */
function constrainWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(maxWidth, width));
}

/**
 * 从 localStorage 加载宽度
 */
function loadWidthFromStorage(storageKey: string): number | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // 忽略存储错误
  }
  return null;
}

/**
 * 保存宽度到 localStorage
 */
function saveWidthToStorage(storageKey: string, width: number): void {
  try {
    localStorage.setItem(storageKey, String(width));
  } catch {
    // 忽略存储错误
  }
}

/**
 * 可调整大小面板 Hook
 */
export function useResizablePanel(options: UseResizablePanelOptions): UseResizablePanelReturn {
  const { defaultWidth, minWidth, maxWidth, storageKey } = options;
  
  // 获取窗口宽度
  const getWindowWidth = useCallback(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1920;
  }, []);
  
  // 计算初始宽度
  const getInitialWidth = useCallback(() => {
    const windowWidth = getWindowWidth();
    
    // 首先尝试从 localStorage 加载
    const storedWidth = loadWidthFromStorage(storageKey);
    if (storedWidth !== null) {
      const parsedMaxWidth = parseWidth(maxWidth, windowWidth);
      return constrainWidth(storedWidth, minWidth, parsedMaxWidth);
    }
    
    // 否则使用默认宽度
    const parsedDefaultWidth = parseWidth(defaultWidth, windowWidth);
    const parsedMaxWidth = parseWidth(maxWidth, windowWidth);
    return constrainWidth(parsedDefaultWidth, minWidth, parsedMaxWidth);
  }, [defaultWidth, minWidth, maxWidth, storageKey, getWindowWidth]);
  
  // 宽度状态
  const [width, setWidthState] = useState<number>(getInitialWidth);
  
  // 拖拽状态
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // 使用 ref 存储待保存的宽度，避免在拖拽过程中频繁写入 localStorage
  const pendingWidthRef = useRef<number | null>(null);
  
  /**
   * 设置宽度（带边界约束）
   */
  const setWidth = useCallback((newWidth: number) => {
    const windowWidth = getWindowWidth();
    const parsedMaxWidth = parseWidth(maxWidth, windowWidth);
    const constrainedWidth = constrainWidth(newWidth, minWidth, parsedMaxWidth);
    
    setWidthState(constrainedWidth);
    
    // 如果正在拖拽，只标记需要保存，不立即写入 localStorage
    if (isDragging) {
      pendingWidthRef.current = constrainedWidth;
    } else {
      // 如果不在拖拽中（例如键盘操作），立即保存
      saveWidthToStorage(storageKey, constrainedWidth);
    }
  }, [minWidth, maxWidth, storageKey, getWindowWidth, isDragging]);
  
  /**
   * 重置为默认宽度
   */
  const resetWidth = useCallback(() => {
    const windowWidth = getWindowWidth();
    const parsedDefaultWidth = parseWidth(defaultWidth, windowWidth);
    const parsedMaxWidth = parseWidth(maxWidth, windowWidth);
    const constrainedWidth = constrainWidth(parsedDefaultWidth, minWidth, parsedMaxWidth);
    
    setWidthState(constrainedWidth);
    saveWidthToStorage(storageKey, constrainedWidth);
    pendingWidthRef.current = null;
  }, [defaultWidth, minWidth, maxWidth, storageKey, getWindowWidth]);
  
  /**
   * 开始拖拽
   */
  const startDragging = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  /**
   * 结束拖拽
   */
  const stopDragging = useCallback(() => {
    setIsDragging(false);
    
    // 拖拽结束后保存宽度到 localStorage
    if (pendingWidthRef.current !== null) {
      saveWidthToStorage(storageKey, pendingWidthRef.current);
      pendingWidthRef.current = null;
    }
  }, [storageKey]);
  
  /**
   * 监听窗口大小变化，调整宽度约束
   */
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = getWindowWidth();
      const parsedMaxWidth = parseWidth(maxWidth, windowWidth);
      
      // 如果当前宽度超过新的最大宽度，调整宽度
      setWidthState(currentWidth => {
        const constrainedWidth = constrainWidth(currentWidth, minWidth, parsedMaxWidth);
        if (constrainedWidth !== currentWidth) {
          // 保存调整后的宽度
          saveWidthToStorage(storageKey, constrainedWidth);
        }
        return constrainedWidth;
      });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [minWidth, maxWidth, storageKey, getWindowWidth]);
  
  return {
    width,
    setWidth,
    resetWidth,
    isDragging,
    startDragging,
    stopDragging,
  };
}
