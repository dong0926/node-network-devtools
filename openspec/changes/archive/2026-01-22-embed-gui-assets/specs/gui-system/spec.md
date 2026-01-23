# Spec Delta: Embedded GUI Assets and Version Display

## MODIFIED Requirements

### Requirement: Web GUI Server
系统 SHALL 启动一个 Web 服务器来托管调试界面，并提供静态资源访问。系统 MUST 能够鲁棒地定位其自带的前端静态资源文件。**系统 SHOULD 优先从内存中提供的嵌入式资产（Embedded Assets）提供服务，以确保在各种运行环境下的路径兼容性。**

#### ADDED Scenario: Serving from memory
- **WHEN** 收到对 `index.html` 或静态资产的 HTTP 请求
- **IF** 内存中存在对应的嵌入式资产
- **THEN** 服务器直接从内存返回资产内容
- **ELSE** 服务器回退到文件系统查找

## ADDED Requirements

### Requirement: GUI Version Identification
**系统 SHALL 在 GUI 界面中显示当前工具的版本号。**

#### Scenario: Version visibility
- **WHEN** 用户打开 GUI 界面
- **THEN** 工具栏（Toolbar）左上角显示当前软件包的版本号（例如 `v0.3.10`）
