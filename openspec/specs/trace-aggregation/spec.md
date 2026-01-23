# trace-aggregation Specification

## Purpose
TBD - created by archiving change implement-server-trace. Update Purpose after archive.
## Requirements
### Requirement: Trace Tree Construction
Upon request completion, the agent MUST aggregate the flat resource records into a hierarchical tree structure based on parent-child relationships captured by `async_hooks`.

#### Scenario: Building a simple tree
- Given a request that calls `A -> B -> C`
- When the request finishes
- Then the output should be a JSON tree where `B` is a child of `A`, and `C` is a child of `B`.

### Requirement: Path Compression
The aggregator MUST compress long chains of Promise resources that do not provide significant timing or logical information.

#### Scenario: Folding Promise chains
- Given a chain of 5 Promises with < 1ms duration each leading to a File System call
- When aggregation occurs
- Then the intermediate Promises should be folded into a single "Promise Chain" node or hidden if "System Noise" is filtered.

### Requirement: Circuit Breaking
The aggregator MUST truncate traces that exceed a predefined maximum node count to prevent memory issues.

#### Scenario: Truncating large trace
- Given a request that generates 10,000 async resources
- When the count reaches 5,000 (default limit)
- Then subsequent resources should be ignored and the root node marked as `truncated: true`.

