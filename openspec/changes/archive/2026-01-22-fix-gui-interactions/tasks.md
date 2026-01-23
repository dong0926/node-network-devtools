# Tasks: Fix GUI Interactions

- [x] 在 `Toolbar.tsx` 中重构 `FilterDropdown` 及其父容器：
    - [x] 将基于 hover 的显示逻辑改为基于点击的显隐逻辑。
    - [x] 实现点击外部自动关闭的功能。
    - [x] 解决 `overflow-x-auto` 导致的下拉菜单裁剪问题。
- [x] 在 `DetailPanel.tsx` 中重构布局：
    - [x] 将整体布局改为 `flex-row`。
    - [x] 将 `Resizer` 移至左侧并确保其高度填充。
    - [x] 确保在移动端和桌面端切换时的样式正确。
- [x] 验证修复：
    - [x] 确认三个过滤器（方法、状态码、类型）均可正常点击展开。
    - [x] 确认详情面板在桌面端可流畅拖拽调整宽度。
    - [x] 重新构建 GUI 并生成嵌入资产。
