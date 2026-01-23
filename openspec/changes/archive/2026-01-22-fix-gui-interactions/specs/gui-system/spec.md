# Spec Delta: GUI Interaction Fixes

## MODIFIED Requirements

### Requirement: Web GUI Server
系统 SHALL 启动一个 Web 服务器来托管调试界面，并提供静态资源访问。**系统提供的前端界面 MUST 支持流畅的用户交互，包括过滤器的菜单选择和面板的大小调整。**

#### MODIFIED Scenario: Access GUI via browser
- **WHEN** 用户访问配置的 GUI URL
- **THEN** 服务器返回前端应用的 `index.html` 和静态资源
- **AND** 用户可以点击工具栏中的过滤器按钮打开下拉菜单进行选择
- **AND** 用户可以在桌面端通过拖拽详情面板左边缘来调整其宽度
