# Proposal: Implement Node.js Server Trace Extension

## Summary
Implement a server-side inbound request tracing extension for `node-network-devtools`. This extension will use `async_hooks` and `AsyncLocalStorage` to capture and visualize the full call chain of incoming requests, including asynchronous operations and I/O.

## Motivation
Current `node-network-devtools` focuses on outbound network requests. Adding server-side tracing provides a complete picture of how a request is processed, helping developers identify performance bottlenecks and understand complex asynchronous flows within their Node.js applications.

## Scope
- **Trace Agent (Backend)**: 
    - `async_hooks` based resource tracking.
    - `AsyncLocalStorage` for context propagation.
    - Interception of `http`, `https`, and `http2` core modules.
    - Framework-specific adapters (starting with Fastify).
    - Data aggregation and path compression.
- **Trace Viewer (Frontend)**:
    - Flame Graph visualization in the DevTools panel.
    - Real-time trace data delivery via WebSocket.
    - Filtering and search capabilities.

## Out of Scope
- Distributed tracing (cross-service).
- Production-grade APM features (this is for development only).
- Non-HTTP protocols (except for WebSocket handshake).
