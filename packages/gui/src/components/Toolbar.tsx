/**
 * 工具栏组件
 * 
 * 包含搜索输入框、方法过滤、状态码过滤、清空/暂停按钮
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const hasSelection = selected.length > 0;

  // 更新下拉菜单位置
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // 点击外部自动关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dropdownMenu = isOpen && createPortal(
    <div 
      ref={dropdownRef}
      className="fixed py-1 bg-devtools-bg-secondary border border-devtools-border rounded shadow-lg z-[100] min-w-[120px] animate-in fade-in slide-in-from-top-1 duration-100"
      style={{ top: `${coords.top + 4}px`, left: `${coords.left}px` }}
    >
      {options.map(option => (
        <button
          key={option}
          className={`w-full px-3 py-1.5 text-xs text-left hover:bg-devtools-bg-hover transition-colors flex items-center gap-2 ${
            selected.includes(option) ? 'text-devtools-accent font-medium' : 'text-devtools-text'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(option);
          }}
        >
          <span className="inline-block w-3 text-center">
            {selected.includes(option) && '✓'}
          </span>
          {option}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 transition-colors ${
          hasSelection
            ? 'bg-devtools-accent text-devtools-bg'
            : 'bg-devtools-bg-secondary text-devtools-text-secondary hover:bg-devtools-bg-hover'
        } ${isOpen ? 'ring-1 ring-devtools-accent' : ''}`}
      >
        {label}
        {hasSelection && <span>({selected.length})</span>}
        <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {dropdownMenu}
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
    <div className="h-8 flex items-center px-2 gap-1 sm:gap-2 border-b border-devtools-border bg-devtools-bg overflow-x-auto">
      {/* 版本号 */}
      <div className="flex items-center h-6 px-2 text-[10px] font-bold bg-devtools-bg-secondary text-devtools-text-secondary rounded select-none shrink-0" title={`v${__APP_VERSION__}`}>
        v{__APP_VERSION__}
      </div>

      {/* 分隔符 */}
      <div className="w-px h-4 bg-devtools-border shrink-0" />

      {/* 搜索输入框 */}
      <input
        type="text"
        placeholder="过滤..."
        value={filters.search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-32 sm:w-48 h-6 px-2 text-xs bg-devtools-bg-secondary border border-devtools-border rounded text-devtools-text placeholder-devtools-text-secondary focus:outline-none focus:border-devtools-accent shrink-0"
      />

      {/* 分隔符 */}
      <div className="w-px h-4 bg-devtools-border shrink-0" />

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
          className="px-2 py-0.5 text-xs rounded bg-devtools-bg-secondary text-devtools-text-secondary hover:bg-devtools-bg-hover whitespace-nowrap shrink-0"
          onClick={onResetFilters}
        >
          重置
        </button>
      )}

      {/* 弹性空间 */}
      <div className="flex-1 min-w-2" />

      {/* 分隔符 */}
      <div className="w-px h-4 bg-devtools-border shrink-0" />

      {/* 暂停/恢复按钮 */}
      <button
        className={`px-2 py-0.5 text-xs rounded shrink-0 ${
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
        className="px-2 py-0.5 text-xs rounded bg-devtools-bg-secondary text-devtools-text-secondary hover:bg-devtools-bg-hover shrink-0"
        onClick={onClear}
        title="清空请求"
      >
        🗑
      </button>
    </div>
  );
}
