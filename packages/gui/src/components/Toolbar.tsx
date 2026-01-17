/**
 * 工具栏组件
 * 
 * 包含搜索输入框、方法过滤、状态码过滤、清空/暂停按钮
 */

import { HTTP_METHODS, STATUS_CODE_GROUPS, REQUEST_TYPES } from '../hooks';
import type { FilterState } from '../hooks';

interface ToolbarProps {
  /** 过滤器状态 */
  filters: FilterState;
  /** 设置搜索关键词 */
  onSearchChange: (search: string) => void;
  /** 切换方法过滤 */
  onToggleMethod: (method: string) => void;
  /** 切换状态码过滤 */
  onToggleStatusCode: (statusCode: string) => void;
  /** 切换类型过滤 */
  onToggleType: (type: string) => void;
  /** 重置过滤器 */
  onResetFilters: () => void;
  /** 是否有活动过滤器 */
  hasActiveFilters: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 切换暂停 */
  onTogglePause: () => void;
  /** 清空请求 */
  onClear: () => void;
}

/**
 * 下拉过滤菜单组件
 */
function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  const hasSelection = selected.length > 0;

  return (
    <div className="relative group">
      <button
        className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
          hasSelection
            ? 'bg-devtools-accent text-devtools-bg'
            : 'bg-devtools-bg-secondary text-devtools-text-secondary hover:bg-devtools-bg-hover'
        }`}
      >
        {label}
        {hasSelection && <span>({selected.length})</span>}
        <span className="text-[10px]">▼</span>
      </button>
      <div className="absolute top-full left-0 mt-1 py-1 bg-devtools-bg-secondary border border-devtools-border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[100px]">
        {options.map(option => (
          <button
            key={option}
            className={`w-full px-3 py-1 text-xs text-left hover:bg-devtools-bg-hover ${
              selected.includes(option) ? 'text-devtools-accent' : 'text-devtools-text'
            }`}
            onClick={() => onToggle(option)}
          >
            {selected.includes(option) && '✓ '}
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 工具栏组件
 */
export function Toolbar({
  filters,
  onSearchChange,
  onToggleMethod,
  onToggleStatusCode,
  onToggleType,
  onResetFilters,
  hasActiveFilters,
  isPaused,
  onTogglePause,
  onClear,
}: ToolbarProps) {
  return (
    <div className="h-8 flex items-center px-2 gap-2 border-b border-devtools-border bg-devtools-bg">
      {/* 搜索输入框 */}
      <input
        type="text"
        placeholder="过滤请求..."
        value={filters.search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-48 h-6 px-2 text-xs bg-devtools-bg-secondary border border-devtools-border rounded text-devtools-text placeholder-devtools-text-secondary focus:outline-none focus:border-devtools-accent"
      />

      {/* 分隔符 */}
      <div className="w-px h-4 bg-devtools-border" />

      {/* 方法过滤 */}
      <FilterDropdown
        label="方法"
        options={HTTP_METHODS}
        selected={filters.methods}
        onToggle={onToggleMethod}
      />

      {/* 状态码过滤 */}
      <FilterDropdown
        label="状态码"
        options={STATUS_CODE_GROUPS}
        selected={filters.statusCodes}
        onToggle={onToggleStatusCode}
      />

      {/* 类型过滤 */}
      <FilterDropdown
        label="类型"
        options={REQUEST_TYPES}
        selected={filters.types}
        onToggle={onToggleType}
      />

      {/* 重置过滤器 */}
      {hasActiveFilters && (
        <button
          className="px-2 py-0.5 text-xs rounded bg-devtools-bg-secondary text-devtools-text-secondary hover:bg-devtools-bg-hover"
          onClick={onResetFilters}
        >
          重置
        </button>
      )}

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 分隔符 */}
      <div className="w-px h-4 bg-devtools-border" />

      {/* 暂停/恢复按钮 */}
      <button
        className={`px-2 py-0.5 text-xs rounded ${
          isPaused
            ? 'bg-devtools-warning text-devtools-bg'
            : 'bg-devtools-bg-secondary text-devtools-text-secondary hover:bg-devtools-bg-hover'
        }`}
        onClick={onTogglePause}
        title={isPaused ? '恢复记录' : '暂停记录'}
      >
        {isPaused ? '▶' : '⏸'}
      </button>

      {/* 清空按钮 */}
      <button
        className="px-2 py-0.5 text-xs rounded bg-devtools-bg-secondary text-devtools-text-secondary hover:bg-devtools-bg-hover"
        onClick={onClear}
        title="清空请求"
      >
        🗑
      </button>
    </div>
  );
}
