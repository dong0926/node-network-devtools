# Proposal: Fix GUI Interactions (Dropdowns and Resizer)

## Why
Users have reported that several key interactive elements in the GUI are not functional:
1.  **Filter Dropdowns**: The Method, Status Code, and Type filters in the Toolbar do not expand upon clicking. Currently, they use a hover-based CSS implementation which is unreliable and doesn't meet user expectations for a "clickable" menu.
2.  **Detail Panel Resizing**: The panel cannot be resized by dragging. The current layout places the `Resizer` component incorrectly within a vertical flex container, preventing it from acting as a vertical handle on the left edge of the panel.

## What Changes
1.  **Toolbar Interaction**:
    *   Convert `FilterDropdown` from hover-based to click-based interaction.
    *   Add state to manage open/closed menus and handle "click outside" to close.
    *   Adjust Toolbar CSS to prevent clipping of absolute-positioned dropdowns.
2.  **Detail Panel Layout**:
    *   Refactor `DetailPanel` to use a horizontal flex layout (`flex-row`).
    *   Position the `Resizer` as the first child (left side) so it correctly spans the height and acts as a handle.
    *   Ensure the content area takes up the remaining space.
3.  **UI Polish**:
    *   Improve the visual feedback during dragging and hovering over interactive elements.
