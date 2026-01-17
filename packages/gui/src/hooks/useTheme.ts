/**
 * 主题 Hook
 * 
 * 管理深色/浅色主题切换，支持 localStorage 持久化
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * 主题类型
 */
export type Theme = 'dark' | 'light';

/**
 * localStorage 键名
 */
const STORAGE_KEY = 'node-network-devtools-theme';

/**
 * 从 localStorage 加载主题
 */
function loadThemeFromStorage(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // 忽略存储错误
  }
  // 默认深色主题
  return 'dark';
}

/**
 * 保存主题到 localStorage
 */
function saveThemeToStorage(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 忽略存储错误
  }
}

/**
 * 主题 Hook 返回值
 */
interface UseThemeReturn {
  /** 当前主题 */
  theme: Theme;
  /** 切换主题 */
  toggleTheme: () => void;
  /** 设置主题 */
  setTheme: (theme: Theme) => void;
  /** 是否为深色主题 */
  isDark: boolean;
}

/**
 * 主题 Hook
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(loadThemeFromStorage);

  // 应用主题到 document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  /**
   * 设置主题
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    saveThemeToStorage(newTheme);
  }, []);

  /**
   * 切换主题
   */
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  };
}
