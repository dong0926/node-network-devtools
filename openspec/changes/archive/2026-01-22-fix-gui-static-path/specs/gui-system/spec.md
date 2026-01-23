# Spec Delta: Robust GUI Path Resolution

## MODIFIED Requirements

### Requirement: Web GUI Server
系统 SHALL 启动一个 Web 服务器来托管调试界面，并提供静态资源访问。**系统 MUST 能够鲁棒地定位其自带的前端静态资源文件。**

#### Scenario: Access GUI via browser
- **WHEN** 用户访问配置的 GUI URL
- **THEN** 服务器返回前端应用的 `index.html` 和静态资源

#### ADDED Scenario: Robust path resolution
- **WHEN** GUI 服务器初始化
- **THEN** 系统按优先级顺序搜索静态资源目录，包括：
  1. 环境变量 `NND_GUI_DIR` 指定的路径
  2. 自动检测到的包安装目录下的 `dist/gui`
  3. 基于模块位置的多个相对路径（涵盖开发和编译后环境）
- **AND** 如果无法找到有效的静态资源目录，系统在启动时输出明确的警告或错误信息
