/**
 * 主应用组件
 * 
 * Node Network DevTools GUI 入口
 */

import { useState, useCallback, useMemo } from 'react';
import { useWebSocket, useRequests, useFilters, useTheme } from './hooks';
import { Toolbar, RequestList, DetailPanel, StatusBar, ThemeToggle } from './components';

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

  // 主题管理
  const { theme, toggleTheme } = useTheme();

  // 请求状态管理
  const {
    requests,
    selectedId,
    selectedRequest,
    selectRequest,
    handleMessage,
    clearRequests,
    totalCount,
    totalSize,
  } = useRequests();

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
        {/* 请求列表 */}
        <RequestList
          requests={filteredRequests}
          selectedId={selectedId}
          onSelectRequest={selectRequest}
          totalCount={totalCount}
        />

        {/* 遮罩层 - 仅在移动设备上显示 */}
        {selectedRequest && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={handleCloseDetail}
            aria-label="关闭详情面板"
          />
        )}

        {/* 详情面板 */}
        {selectedRequest && (
          <div className="fixed right-0 top-0 bottom-0 z-20 md:relative md:z-auto">
            <DetailPanel
              request={selectedRequest}
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
