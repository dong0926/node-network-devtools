/**
 * 主题切换按钮组件
 */

import type { Theme } from '../hooks';

interface ThemeToggleProps {
  /** 当前主题 */
  theme: Theme;
  /** 切换主题回调 */
  onToggle: () => void;
}

/**
 * 主题切换按钮组件
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      className="px-2 py-0.5 text-xs rounded bg-devtools-bg hover:bg-devtools-bg-hover text-devtools-text-secondary"
      onClick={onToggle}
      title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
