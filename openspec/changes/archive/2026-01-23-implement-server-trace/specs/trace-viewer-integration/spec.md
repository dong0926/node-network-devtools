# Spec Delta: Trace Viewer Integration

## ADDED Requirements

### Requirement: Real-time Trace Delivery
Server trace data MUST be delivered to the frontend via WebSocket as soon as the aggregation is complete.

#### Scenario: Receiving trace in UI
- Given the DevTools GUI is open
- When a server-side request completes
- Then a `SERVER_TRACE` event should be received by the GUI and displayed in the Trace panel.

### Requirement: Flame Graph Visualization
The GUI MUST provide a Flame Graph view to visualize the hierarchical trace data and timing.

#### Scenario: Interacting with Flame Graph
- Given a displayed trace
- When a user clicks on a node in the flame graph
- Then the side panel should display the stack trace and precise duration for that node.

### Requirement: Noise Filtering UI
The GUI MUST provide a toggle to show/hide "System Noise" (folded Promise chains and internal nodes).

#### Scenario: Toggling noise
- Given a complex trace with many internal nodes
- When the user toggles "Hide System Noise" ON
- Then the flame graph should only show I/O and significant business logic nodes.
