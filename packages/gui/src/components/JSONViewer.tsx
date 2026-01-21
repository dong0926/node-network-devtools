/**
 * JSON 查看器组件
 * 
 * 提供可折叠展示 JSON 数据的功能，支持：
 * - 递归渲染 JSON 树结构
 * - 展开/折叠节点
 * - 默认展开层级控制
 * - 类型颜色区分
 * - 元素数量显示
 * 
 * 性能优化：
 * - 使用 React.memo 避免不必要的重渲染
 * - 使用 useCallback 优化事件处理函数
 * - 使用 useMemo 优化计算密集型操作
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { getNodeType, getNodeSize, tryParseJSON } from '../utils/json-utils';
import type { JSONNodeType } from '../utils/json-utils';

/**
 * JSONViewer 组件属性
 */
interface JSONViewerProps {
  /** JSON 数据（对象、数组或字符串） */
  data: unknown;
  /** 默认展开层级，默认为 1 */
  defaultExpandLevel?: number;
  /** 是否显示根节点，默认为 false */
  showRoot?: boolean;
}

/**
 * JSONNode 组件属性
 */
interface JSONNodeProps {
  /** 节点键名 */
  keyName?: string;
  /** 节点值 */
  value: unknown;
  /** 当前层级（从 0 开始） */
  level: number;
  /** 默认展开层级 */
  defaultExpandLevel: number;
  /** 是否是最后一个节点 */
  isLast?: boolean;
  /** 节点路径（用于唯一标识） */
  path: string;
  /** 展开状态映射 */
  expandedMap: Map<string, boolean>;
  /** 切换展开状态的回调 */
  onToggleExpand: (path: string, defaultExpanded: boolean) => void;
}

/**
 * 获取数据类型对应的颜色类名
 */
function getTypeColor(type: JSONNodeType): string {
  switch (type) {
    case 'string':
      return 'text-devtools-string';
    case 'number':
      return 'text-devtools-number';
    case 'boolean':
      return 'text-devtools-boolean';
    case 'null':
    case 'undefined':
      return 'text-devtools-null';
    default:
      return 'text-devtools-text';
  }
}

/**
 * 格式化原始值的显示
 */
function formatPrimitiveValue(value: unknown, type: JSONNodeType): string {
  if (type === 'string') {
    return `"${value}"`;
  }
  if (type === 'null') {
    return 'null';
  }
  if (type === 'undefined') {
    return 'undefined';
  }
  return String(value);
}

/**
 * JSON 节点组件（递归渲染）
 * 使用 React.memo 优化性能，避免不必要的重渲染
 */
const JSONNode = memo(function JSONNode({
  keyName,
  value,
  level,
  defaultExpandLevel,
  isLast = false,
  path,
  expandedMap,
  onToggleExpand,
}: JSONNodeProps) {
  // ===== 所有 Hooks 必须在任何条件返回之前调用 =====
  
  // 使用 useMemo 缓存节点类型计算
  const type = useMemo(() => getNodeType(value), [value]);
  const isExpandable = useMemo(() => type === 'object' || type === 'array', [type]);
  
  // 使用 useMemo 缓存展开状态计算
  const defaultExpanded = useMemo(() => level < defaultExpandLevel, [level, defaultExpandLevel]);
  const isExpanded = useMemo(() => 
    expandedMap.has(path) ? expandedMap.get(path)! : defaultExpanded,
    [expandedMap, path, defaultExpanded]
  );

  // 使用 useMemo 缓存缩进计算
  const indent = useMemo(() => level * 16, [level]); // 每层缩进 16px

  // 使用 useMemo 缓存对象/数组的元数据计算（即使不是可展开节点也要调用）
  const nodeMetadata = useMemo(() => {
    if (!isExpandable) return null;
    const size = getNodeSize(value);
    const isArray = type === 'array';
    return {
      size,
      isArray,
      openBracket: isArray ? '[' : '{',
      closeBracket: isArray ? ']' : '}',
      typeHint: isArray ? '[...]' : '{...}',
    };
  }, [value, type, isExpandable]);

  // 使用 useMemo 缓存子节点条目计算（即使不展开也要调用）
  const entries = useMemo(() => {
    if (!isExpandable || !isExpanded) return [];
    const isArray = type === 'array';
    return isArray
      ? (value as unknown[]).map((item, index) => [String(index), item] as const)
      : Object.entries(value as Record<string, unknown>);
  }, [value, type, isExpandable, isExpanded]);

  // 使用 useCallback 优化切换展开状态的事件处理函数
  const handleToggle = useCallback(() => {
    if (isExpandable) {
      onToggleExpand(path, defaultExpanded);
    }
  }, [isExpandable, path, onToggleExpand, defaultExpanded]);

  // 使用 useCallback 优化键盘事件处理函数
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  // ===== 现在可以安全地使用条件返回 =====

  // 如果是原始值（非对象/数组）
  if (!isExpandable) {
    return (
      <div
        className="font-mono text-xs leading-relaxed"
        style={{ paddingLeft: `${indent}px` }}
      >
        {keyName && (
          <>
            <span className="text-devtools-property">{keyName}</span>
            <span className="text-devtools-text">: </span>
          </>
        )}
        <span className={getTypeColor(type)}>
          {formatPrimitiveValue(value, type)}
        </span>
        {!isLast && <span className="text-devtools-text">,</span>}
      </div>
    );
  }

  // 解构元数据（此时 nodeMetadata 不会为 null）
  const { size, isArray, openBracket, closeBracket, typeHint } = nodeMetadata!;

  // 如果折叠状态
  if (!isExpanded) {
    return (
      <div
        className="font-mono text-xs leading-relaxed cursor-pointer hover:bg-devtools-hover"
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={false}
        aria-label={`展开 ${keyName || (isArray ? '数组' : '对象')}, ${size} 个${isArray ? '元素' : '属性'}`}
      >
        <span className="inline-block w-3 text-devtools-text-secondary" aria-hidden="true">▶</span>
        {keyName && (
          <>
            <span className="text-devtools-property">{keyName}</span>
            <span className="text-devtools-text">: </span>
          </>
        )}
        <span className="text-devtools-text-secondary">
          {typeHint} {size > 0 && `{${size}}`}
        </span>
        {!isLast && <span className="text-devtools-text">,</span>}
      </div>
    );
  }

  // 展开状态
  return (
    <div className="font-mono text-xs" role="group" aria-label={keyName || (isArray ? '数组' : '对象')}>
      {/* 开始括号行 */}
      <div
        className="leading-relaxed cursor-pointer hover:bg-devtools-hover"
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={true}
        aria-label={`折叠 ${keyName || (isArray ? '数组' : '对象')}, ${entries.length} 个${isArray ? '元素' : '属性'}`}
      >
        <span className="inline-block w-3 text-devtools-text-secondary" aria-hidden="true">▼</span>
        {keyName && (
          <>
            <span className="text-devtools-property">{keyName}</span>
            <span className="text-devtools-text">: </span>
          </>
        )}
        <span className="text-devtools-text">{openBracket}</span>
      </div>

      {/* 子节点 */}
      {entries.map(([key, childValue], index) => (
        <JSONNode
          key={key}
          keyName={isArray ? undefined : key}
          value={childValue}
          level={level + 1}
          defaultExpandLevel={defaultExpandLevel}
          isLast={index === entries.length - 1}
          path={`${path}.${key}`}
          expandedMap={expandedMap}
          onToggleExpand={onToggleExpand}
        />
      ))}

      {/* 结束括号行 */}
      <div
        className="leading-relaxed"
        style={{ paddingLeft: `${indent}px` }}
      >
        <span className="inline-block w-3"></span>
        <span className="text-devtools-text">{closeBracket}</span>
        {!isLast && <span className="text-devtools-text">,</span>}
      </div>
    </div>
  );
});

/**
 * JSON 查看器主组件
 */
export function JSONViewer({
  data,
  defaultExpandLevel = 1,
  showRoot = false,
}: JSONViewerProps) {
  // 展开状态映射（path -> isExpanded）
  const [expandedMap, setExpandedMap] = useState<Map<string, boolean>>(new Map());

  // 使用 useCallback 优化切换展开状态的回调函数
  const handleToggleExpand = useCallback((path: string, defaultExpanded: boolean) => {
    setExpandedMap(prev => {
      const next = new Map(prev);
      // 如果已经有显式状态，切换它；否则切换默认状态
      const currentState = next.has(path) ? next.get(path)! : defaultExpanded;
      next.set(path, !currentState);
      return next;
    });
  }, []);

  // 使用 useMemo 缓存数据解析结果
  const parsedData = useMemo(() => {
    if (typeof data === 'string') {
      const parsed = tryParseJSON(data);
      return parsed;
    }
    return data;
  }, [data]);

  // 如果是无效 JSON 字符串，显示原始文本
  if (typeof data === 'string' && parsedData === null) {
    return (
      <pre className="p-2 bg-devtools-bg-secondary rounded text-devtools-text text-xs overflow-auto whitespace-pre-wrap break-all">
        {data}
      </pre>
    );
  }

  // 如果数据为空或 null
  if (parsedData === null || parsedData === undefined) {
    return (
      <pre className="p-2 bg-devtools-bg-secondary rounded text-devtools-text text-xs overflow-auto whitespace-pre-wrap break-all">
        {String(parsedData)}
      </pre>
    );
  }

  // 使用 useMemo 缓存节点类型计算
  const type = useMemo(() => getNodeType(parsedData), [parsedData]);
  
  // 如果不是对象或数组，显示原始值
  if (type !== 'object' && type !== 'array') {
    return (
      <pre className="p-2 bg-devtools-bg-secondary rounded text-devtools-text text-xs overflow-auto whitespace-pre-wrap break-all">
        {formatPrimitiveValue(parsedData, type)}
      </pre>
    );
  }

  return (
    <div className="p-2 bg-devtools-bg-secondary rounded overflow-auto">
      <JSONNode
        keyName={showRoot ? 'root' : undefined}
        value={parsedData}
        level={0}
        defaultExpandLevel={defaultExpandLevel}
        path="root"
        expandedMap={expandedMap}
        onToggleExpand={handleToggleExpand}
      />
    </div>
  );
}
