# Design: Node.js Server Trace Extension

## Architectural Overview
The server trace extension consists of a **Trace Agent** embedded in the target Node.js process and a **Trace Viewer** integrated into the DevTools UI.

### Trace Agent
1. **TraceManager**: Singleton managing the lifecycle of tracing, including activation, configuration, and data buffering.
2. **Patcher/Interceptor**: 
   - Wraps `http.createServer` and equivalent methods in `https` and `http2`.
   - Initializes `AsyncLocalStorage` context for each incoming request.
3. **Collector**:
   - Uses `async_hooks` to track asynchronous resources (`TCPWRAP`, `FSREQCALLBACK`, etc.).
   - Captures stack traces using a customized `Error.prepareStackTrace` for minimal overhead.
   - Implements circuit breaking to prevent memory overflow (e.g., max 5000 nodes per request).
4. **Aggregator**:
   - Upon request completion (`res.on('finish')`), converts the flat resource map into a hierarchical tree.
   - Applies compression rules (e.g., folding short-lived promise chains).

### Trace Viewer
1. **Data Model**: Hierarchical JSON structure compatible with flame graph rendering.
2. **UI Components**:
   - **Flame Graph**: Visualizes the call tree and timing.
   - **Details Pane**: Displays stack traces and metadata for selected nodes.
3. **Event Bridge**: Extends the existing `EventBridge` to transport trace events via WebSocket.

## Data Flow
1. **Request Ingress**: `http` patcher catches request -> `AsyncLocalStorage.run` starts -> `TraceContext` created.
2. **Execution**: `async_hooks` triggers -> link resource to `TraceContext` -> record timing and stack trace.
3. **Request Egress**: `res.finish` -> `Aggregator` processes context -> `EventBridge` emits `server-trace` event.
4. **UI Update**: Frontend receives event -> renders/updates Flame Graph.

## Performance Considerations
- **Lazy Loading**: `async_hooks` is only registered if `trace.enabled` is true.
- **Filtering**: Aggressive filtering of system/internal async resources.
- **Sampling**: Stack trace capture is limited to I/O and significant tasks.
- **Memory**: Circular buffer or fixed limits for trace nodes per request.
