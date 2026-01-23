# trace-data-collection Specification

## Purpose
TBD - created by archiving change implement-server-trace. Update Purpose after archive.
## Requirements
### Requirement: Async Hooks Resource Tracking
The agent MUST use `async_hooks` to monitor the lifecycle (init, before, after, destroy) of asynchronous resources.

#### Scenario: Tracking a TCP connection
- Given a request that triggers a database query (TCP)
- When the query is initiated
- Then the `async_hooks.init` should capture the resource ID and link it to the current trace.

### Requirement: Smart Stack Trace Capture
The agent MUST capture stack traces only for specific resource types (I/O) or when a threshold is exceeded, to minimize performance overhead.

#### Scenario: Capturing stack for FS operation
- Given a `fs.readFile` call
- When the `async_hooks.init` is triggered for `FSREQCALLBACK`
- Then a 5-level deep stack trace should be captured, filtering out internal Node.js frames.

### Requirement: Resource Filtering
The collector MUST discard async resources that are not related to an active inbound request or are part of the tracing system itself.

#### Scenario: Filtering system timers
- Given a background `setInterval` task
- When it triggers during a request
- Then it should NOT be included in the request's trace if it wasn't started within the request context.

