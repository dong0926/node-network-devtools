# Tasks: Implement Server Trace Extension

## Phase 1: Core Agent Infrastructure
- [x] Implement `TraceConfig` and `TraceManager` singleton in `src/context/`.
- [x] Create `http`/`https` patchers to wrap `requestListener` with `AsyncLocalStorage`.
- [x] Add `serverTrace` toggle to the global configuration.

## Phase 2: Data Collection and Lifecycle
- [x] Implement `async_hooks` based collector in `src/interceptors/`.
- [x] Implement `SmartStackCollector` using `Error.prepareStackTrace`.
- [x] Add resource filtering logic (TCP, FS, HTTP).
- [x] Implement circuit breaker for max nodes per request.

## Phase 3: Aggregation and Transport
- [x] Implement `TraceTreeBuilder` with path compression (Promise chain folding).
- [x] Extend `EventBridge` and `WebSocketHub` to handle `SERVER_TRACE` events.
- [x] Add Fastify framework adapter (`onRequest` hook).

## Phase 4: UI Implementation
- [x] Create `ServerTracePanel` component in `packages/gui/src/components/`.
- [x] Integrate a flame graph library (e.g., `react-flame-graph`).
- [x] Implement node selection and stack trace viewer.
- [x] Add "Hide System Noise" toggle logic in UI.

## Phase 5: Verification
- [x] Add integration tests for Express tracing.
- [x] Add integration tests for Fastify tracing.
- [x] Verify performance impact with a benchmark script.
