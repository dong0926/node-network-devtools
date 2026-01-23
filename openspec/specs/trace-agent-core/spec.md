# trace-agent-core Specification

## Purpose
TBD - created by archiving change implement-server-trace. Update Purpose after archive.
## Requirements
### Requirement: Process-level Trace Activation
The tracing capability MUST be configurable at process startup and cannot be toggled dynamically without a restart to avoid inconsistent `async_hooks` state.

#### Scenario: Enabling trace via config
- Given a configuration with `trace.enabled: true`
- When the application starts
- Then the `TraceManager` should initialize and patch the core `http` module.

### Requirement: Core HTTP Interception
The agent MUST intercept `http.createServer` and `https.createServer` to wrap the `requestListener` within an `AsyncLocalStorage` context.

#### Scenario: Wrapping request listener
- Given an Express application
- When a request arrives
- Then the code inside the route handler should be able to access the current `TraceContext` via `AsyncLocalStorage`.

### Requirement: AsyncLocalStorage Integration
Every inbound request MUST be associated with a unique `TraceContext` stored in `AsyncLocalStorage`.

#### Scenario: Context Propagation
- Given an active request
- When an asynchronous operation (e.g., `fs.readFile`) is started
- Then the operation should be automatically linked to the parent `TraceContext`.

