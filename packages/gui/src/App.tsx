/**
 * 主应用组件
 * 
 * Node Network DevTools GUI 入口
 */

import { useState, useCallback, useMemo } from 'react';
import { useWebSocket, useRequests, useFilters, useTheme } from './hooks';
import { Toolbar, RequestList, TraceList, DetailPanel, StatusBar, ThemeToggle } from './components';

/**
 * 从 URL 参数获取 WebSocket 端口
 */
function getWsPortFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const port = params.get('wsPort');
  return port ? parseInt(port, 10) : null;
}

/**
 * 主应用组件
 */
function App() {
  const [wsPort] = useState<number | null>(getWsPortFromUrl);
  const [isPaused, setIsPaused] = useState(false);
  const [view, setView] = useState<'network' | 'traces'>('network');

  // 主题管理
  const { theme, toggleTheme } = useTheme();

  // 请求状态管理
  const {
    requests,
    serverTraces,
    selectedId,
    selectedRequest,
    selectRequest,
    handleMessage,
    clearRequests,
    totalCount,
    totalSize,
  } = useRequests();

  // 转换为列表
  const tracesList = useMemo(() => {
    return Array.from(serverTraces.values()).sort((a, b) => b.startTime - a.startTime);
  }, [serverTraces]);

  // 计算当前选中的 Trace
  const currentTrace = useMemo(() => {
    if (!selectedId) return undefined;
    // 优先从 serverTraces 直接取（如果是从 TraceList 选中的）
    const trace = serverTraces.get(selectedId);
    if (trace) return trace;
    // 其次通过选中的请求取
    return selectedRequest?.traceId ? serverTraces.get(selectedRequest.traceId) : undefined;
  }, [selectedId, serverTraces, selectedRequest]);

  // 模拟一个 UIRequest 给单独的 Trace 使用
  const mockRequestFromTrace = useMemo(() => {
    if (view !== 'traces' || !currentTrace || selectedRequest) return selectedRequest;
    
    // 如果只有 Trace 没有对应的 Request（比如入口请求），我们构造一个简易对象展示
    return {
      id: selectedId,
      url: currentTrace.name,
      method: currentTrace.name.split(' ')[0] || 'GET',
      status: 'complete',
      type: 'document',
      startTime: currentTrace.startTime,
      requestHeaders: (currentTrace as any).metadata?.headers || {},
      responseHeaders: {},
    } as any;
  }, [view, currentTrace, selectedRequest, selectedId]);

  // 过滤器
  const {
    filters,
    setSearch,
    toggleMethod,
    toggleStatusCode,
    toggleType,
    resetFilters,
    filterRequests,
    hasActiveFilters,
  } = useFilters();

  // WebSocket 消息处理（考虑暂停状态）
  const onMessage = useCallback(
    (message: Parameters<typeof handleMessage>[0]) => {
      // 暂停时不处理新请求，但处理初始数据和清空
      if (isPaused && message.type !== 'requests:initial' && message.type !== 'requests:clear') {
        return;
      }
      handleMessage(message);
    },
    [handleMessage, isPaused]
  );

  // WebSocket 连接
  const { status, send } = useWebSocket({
    port: wsPort,
    onMessage,
  });

  // 过滤后的请求列表
  const filteredRequests = useMemo(() => {
    return filterRequests(requests);
  }, [filterRequests, requests]);

  // 切换暂停状态
  const togglePause = useCallback(() => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    send({
      type: newPaused ? 'control:pause' : 'control:resume',
      payload: null,
      timestamp: Date.now(),
    });
  }, [isPaused, send]);

  // 清空请求
  const handleClear = useCallback(() => {
    clearRequests();
    send({
      type: 'requests:clear',
      payload: null,
      timestamp: Date.now(),
    });
  }, [clearRequests, send]);

  // 关闭详情面板
  const handleCloseDetail = useCallback(() => {
    selectRequest(null);
  }, [selectRequest]);

  return (
    <div className="h-full flex flex-col bg-devtools-bg">
      {/* 顶部标题栏 */}
      <header className="h-10 flex items-center px-4 border-b border-devtools-border bg-devtools-bg-secondary shrink-0">
        <h1 className="text-sm font-medium text-devtools-text">
          Node Network DevTools
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          {wsPort && (
            <span className="text-xs text-devtools-text-secondary">
              WS: {wsPort}
            </span>
          )}
        </div>
      </header>

      {/* 工具栏 */}
      <Toolbar
        view={view}
        onViewChange={setView}
        filters={filters}
        onSearchChange={setSearch}
        onToggleMethod={toggleMethod}
        onToggleStatusCode={toggleStatusCode}
        onToggleType={toggleType}
        onResetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onClear={handleClear}
      />

      {/* 主内容区域 */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* 列表区域 */}
        {view === 'network' ? (
          <RequestList
            requests={filteredRequests}
            selectedId={selectedId}
            onSelectRequest={selectRequest}
            totalCount={totalCount}
          />
        ) : (
          <TraceList
            traces={tracesList}
            selectedId={selectedId}
            onSelectTrace={selectRequest}
          />
        )}

        {/* 遮罩层 - 仅在移动设备上显示 */}
        {(selectedRequest || (view === 'traces' && currentTrace)) && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={handleCloseDetail}
            aria-label="关闭详情面板"
          />
        )}

        {/* 详情面板 */}
        {(mockRequestFromTrace || currentTrace) && (
          <div className="fixed right-0 top-0 bottom-0 z-20 md:relative md:z-auto">
            <DetailPanel
              request={mockRequestFromTrace}
              trace={currentTrace}
              initialTab={view === 'traces' ? 'trace' : undefined}
            />
          </div>
        )}
      </main>

      {/* 状态栏 */}
      <StatusBar
        displayCount={filteredRequests.length}
        totalCount={totalCount}
        totalSize={totalSize}
        connectionStatus={status}
        isPaused={isPaused}
      />
    </div>
  );
}

export default App;
