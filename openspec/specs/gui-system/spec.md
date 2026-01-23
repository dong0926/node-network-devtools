# gui-system Specification

## Purpose
TBD - created by archiving change initialize-core-specifications. Update Purpose after archive.
## Requirements
### Requirement: Web GUI Server
系统 SHALL 启动一个 Web 服务器来托管调试界面，并提供静态资源访问。**系统提供的前端界面 MUST 支持流畅的用户交互，包括过滤器的菜单选择和面板的大小调整。**

#### MODIFIED Scenario: Access GUI via browser
- **WHEN** 用户访问配置的 GUI URL
- **THEN** 服务器返回前端应用的 `index.html` 和静态资源
- **AND** 用户可以点击工具栏中的过滤器按钮打开下拉菜单进行选择
- **AND** 用户可以在桌面端通过拖拽详情面板左边缘来调整其宽度

### Requirement: Real-time Data Push
系统 SHALL 通过 WebSocket 将拦截到的网络事件实时推送到已连接的 GUI 客户端。

#### Scenario: Live update on new request
- **WHEN** 一个新的网络请求被拦截
- **THEN** 服务器通过 WebSocket 发送 `request-start` 消息给所有客户端

### Requirement: Auto-open Browser
系统 SHALL 在配置允许时自动启动一个极简的浏览器窗口来显示 GUI。

#### Scenario: Automatic launch
- **WHEN** GUI 服务器成功启动且 `autoOpen` 为 true
- **THEN** 系统调用 Puppeteer 启动一个指定大小的浏览器窗口

### Requirement: GUI Version Identification
**系统 SHALL 在 GUI 界面中显示当前工具的版本号。**

#### Scenario: Version visibility
- **WHEN** 用户打开 GUI 界面
- **THEN** 工具栏（Toolbar）左上角显示当前软件包的版本号（例如 `v0.3.10`）

