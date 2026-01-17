# GUI 演示说明

## 启动后 GUI 中会显示的请求

当你启动 Next.js 示例并访问 http://localhost:3000 后，GUI 中会实时显示以下网络请求：

### 1. Server Component 请求

页面加载时，Server Component 会自动发起以下请求：

#### 请求 1：获取用户列表（带缓存）
```
GET https://jsonplaceholder.typicode.com/users
状态: 200 OK
缓存: revalidate: 60, tags: ['users']
类型: Server Component
```

**GUI 中显示的信息**：
- Method: `GET`
- URL: `https://jsonplaceholder.typicode.com/users`
- Status: `200`
- Time: ~200-500ms
- Headers: 包含 Content-Type, Content-Length 等
- Response: JSON 格式的用户列表数据
- Next.js 特有信息:
  - Cache: `force-cache`
  - Revalidate: `60`
  - Tags: `['users']`

#### 请求 2：获取文章列表（不缓存）
```
GET https://jsonplaceholder.typicode.com/posts
状态: 200 OK
缓存: no-store
类型: Server Component
```

**GUI 中显示的信息**：
- Method: `GET`
- URL: `https://jsonplaceholder.typicode.com/posts`
- Status: `200`
- Time: ~200-500ms
- Cache: `no-store`

### 2. Server Actions 请求

当你在页面上提交表单时：

#### 创建用户
```
POST https://jsonplaceholder.typicode.com/users
状态: 201 Created
类型: Server Action
Body: {"name": "测试用户", "email": "test@example.com"}
```

**GUI 中显示的信息**：
- Method: `POST`
- URL: `https://jsonplaceholder.typicode.com/users`
- Status: `201`
- Request Headers: `Content-Type: application/json`
- Request Body: 可以查看发送的 JSON 数据
- Response Body: 服务器返回的创建结果

#### 删除用户
```
DELETE https://jsonplaceholder.typicode.com/users/1
状态: 200 OK
类型: Server Action
```

### 3. API Route Handler 请求

当你访问 http://localhost:3000/api/users 时：

```
GET https://jsonplaceholder.typicode.com/users
状态: 200 OK
类型: Route Handler
来源: /api/users
```

**GUI 中显示的信息**：
- Method: `GET`
- URL: `https://jsonplaceholder.typicode.com/users`
- Status: `200`
- Initiator: Route Handler `/api/users`
- Response: 完整的用户列表 JSON

## GUI 界面功能

### 请求列表
- 实时显示所有捕获的网络请求
- 每个请求显示：方法、URL、状态码、耗时
- 颜色编码：
  - 绿色：2xx 成功
  - 黄色：3xx 重定向
  - 红色：4xx/5xx 错误

### 过滤功能
- 按方法过滤：GET, POST, PUT, DELETE 等
- 按状态码过滤：2xx, 3xx, 4xx, 5xx
- 按 URL 搜索：输入关键词快速查找

### 详情面板
点击任意请求可查看：

1. **Headers 标签页**
   - Request Headers（请求头）
   - Response Headers（响应头）
   - 自动脱敏敏感信息（authorization, cookie 等）

2. **Payload 标签页**
   - Request Body（请求体）
   - 支持 JSON 格式化显示
   - 支持文本、表单数据等

3. **Response 标签页**
   - Response Body（响应体）
   - JSON 自动格式化
   - 支持大文本查看

4. **Timing 标签页**
   - DNS 查询时间
   - TCP 连接时间
   - TLS 握手时间
   - 请求发送时间
   - 等待响应时间
   - 内容下载时间
   - 总耗时

### 工具栏功能
- 🗑️ **Clear**：清空所有请求记录
- ⏸️ **Pause**：暂停捕获新请求
- ▶️ **Resume**：恢复捕获
- 🌙 **Theme**：切换深色/浅色主题

## 实际使用流程

### 步骤 1：启动应用
```bash
cd examples/nextjs-app
pnpm dev:gui
```

### 步骤 2：打开 GUI
从控制台复制 GUI URL，例如：
```
http://127.0.0.1:54584?wsPort=54585
```

### 步骤 3：访问应用
在另一个浏览器标签页打开：
```
http://localhost:3000
```

### 步骤 4：观察 GUI
切换回 GUI 标签页，你会看到：
- 页面加载时的 2 个 GET 请求（用户列表和文章列表）
- 请求的详细信息、响应数据
- Next.js 特有的缓存配置信息

### 步骤 5：触发更多请求
在应用页面上：
1. 填写表单创建用户 → GUI 中出现 POST 请求
2. 填写 ID 删除用户 → GUI 中出现 DELETE 请求
3. 点击 "访问 /api/users" 链接 → GUI 中出现新的 GET 请求

### 步骤 6：查看详情
在 GUI 中点击任意请求：
- 查看完整的请求头和响应头
- 查看 JSON 格式的请求体和响应体
- 查看详细的时间分析

## Next.js 特有功能展示

### 缓存状态显示
GUI 会显示 Next.js 的缓存配置：
```
Cache Mode: force-cache
Revalidate: 60 seconds
Tags: ['users']
```

### 请求来源追踪
GUI 会显示请求来自哪个 Next.js 组件：
```
Type: Server Component
Route: /
```

或
```
Type: Server Action
Action: createUser
```

或
```
Type: Route Handler
Route: /api/users
```

## 对比其他示例

### basic-http 示例
- 显示原始的 http 模块请求
- 包含本地服务器的请求和响应

### fetch-api 示例
- 显示 Node.js 原生 fetch 请求
- 更现代的 API 调用方式

### Next.js 示例（本示例）
- 显示 Next.js 特有的请求类型
- 包含缓存配置信息
- 区分 Server Component、Server Action、Route Handler
- 展示 Next.js 的数据获取模式

## 提示

1. **实时更新**：GUI 通过 WebSocket 实时接收请求数据，无需刷新页面
2. **性能影响**：开发环境下性能影响很小，但不建议在生产环境使用
3. **数据脱敏**：敏感的请求头（如 authorization、cookie）会自动脱敏显示
4. **请求限制**：默认最多存储 500 个请求，超过后会自动删除最旧的请求

## 截图说明

由于这是一个文本文档，无法直接展示截图。但你可以按照上述步骤操作，亲自体验 GUI 的功能。

GUI 的界面类似于 Chrome DevTools 的 Network 面板，包含：
- 左侧：请求列表（表格形式）
- 右侧：详情面板（多个标签页）
- 顶部：工具栏和过滤器
- 底部：状态栏（显示请求总数、已选择等）

所有的网络请求都会以清晰、易读的方式展示，帮助你调试和分析 Next.js 应用的网络行为。
