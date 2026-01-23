# Design: GUI Interaction Fixes

## 1. Toolbar Dropdowns

### Interaction Change
The current `group-hover` implementation in `Toolbar.tsx` will be replaced with a state-controlled toggle.

```tsx
function FilterDropdown({ label, options, selected, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  // ... handle click to toggle isOpen ...
  // ... handle click outside to close ...
}
```

### Layout Fix
The `Toolbar` container's `overflow-x-auto` can cause the `absolute` dropdowns to be clipped. We will:
-   Change the structure to ensure the dropdown menu has a higher `z-index` and is not clipped by `overflow-y: hidden` (which is often implied by `overflow-x: auto`).
-   Alternatively, use a ref and calculate positioning or adjust the container height/overflow properties.

## 2. Detail Panel Resizing

### Layout Structure
The `DetailPanel` currently has:
```tsx
<div className="flex-col">
  <div className="md:block"><Resizer /></div>
  <div className="tabs" />
  <div className="content" />
</div>
```
This makes the `Resizer` a horizontal bar at the top. It should be:
```tsx
<div className="flex-row h-full">
  <Resizer />
  <div className="flex-col flex-1">
    <div className="tabs" />
    <div className="content" />
  </div>
</div>
```

### Mobile Support
The `Resizer` will remain hidden on mobile (`md:block`) as the panel covers the full width there anyway.

## 3. Implementation Plan
-   Update `FilterDropdown` in `Toolbar.tsx`.
-   Refactor `DetailPanel.tsx` component structure.
-   Verify all mouse events and CSS transitions.
