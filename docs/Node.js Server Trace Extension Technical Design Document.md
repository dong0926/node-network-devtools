# **开发设计文档：Node.js 服务端全链路追踪扩展 (v3.0-Final)**

**项目名称**：node-network-devtools 服务端扩展

**版本**：v3.0-Final

**状态**：待开发

**适用场景**：开发环境调试 (Development-Only)

## ---

**1\. 执行摘要与核心原则**

本项目旨在为 node-network-devtools 扩展**服务端入站请求全链路追踪**能力。通过结合 Node.js 原生 async\_hooks 和 AsyncLocalStorage，构建一个**按需开启**的追踪代理（Trace Agent），能够在不修改业务代码的前提下，可视化请求内部的同步/异步调用链与耗时。

### **1.1 核心设计原则**

1. **开发态定位**：本工具定位为 DevTools，而非生产环境 APM。允许在开启追踪时牺牲部分吞吐量以换取高精度的调试信息。  
2. **按需注入 (Lazy Patching)**：追踪能力仅在启动时通过配置显式开启。未开启时，不加载 async\_hooks，不进行任何模块劫持，确保对运行时零开销。  
3. **双层拦截模型**：采用“底层模块劫持 \+ 框架层适配 hook”的混合策略，以最大化兼容 Node.js 生态（Express, Koa, Fastify, NestJS）。  
4. **智能降噪**：在采集端和聚合端实施激进的过滤策略，消除 Promise 胶水代码产生的视觉噪音，仅展示具有业务意义的节点（I/O, Controller, Significant Computation）。

## ---

**2\. 总体架构设计**

系统由 **Trace Agent** (后端采集) 和 **Trace Viewer** (前端展示) 两部分组成。

### **2.1 数据流向**

1. **Bootstrap**: 启动时检查配置，若启用追踪，则 Patch 核心模块并注册 async\_hooks。  
2. **Ingress**: 请求到达，拦截器初始化 TraceContext 并存入 AsyncLocalStorage。  
3. **Capture**: async\_hooks 监听异步资源生命周期，结合 V8 Stack Trace API 捕获关键节点的调用栈。  
4. **Aggregation**: 请求结束 (res.finish)，后端执行“路径压缩算法”构建调用树。  
5. **Transport**: 通过 WebSocket 将序列化后的 Trace Tree 推送至前端。  
6. **Render**: 前端渲染火焰图 (Flame Graph)。

## ---

**3\. 后端详细设计 (Trace Agent)**

### **3.1 启动与配置 (Bootstrap)**

追踪功能的开启必须是**进程级**的配置，不支持运行时频繁切换。

TypeScript

interface TraceConfig {  
  enabled: boolean;           // 仅在 true 时执行 Patch  
  maxNodesPerRequest: number; // 默认 5000，防止 OOM  
  captureThresholdMs: number; // 默认 2ms，低于此值的纯 CPU 节点可能会被折叠  
  ignoredModules: string;   // 默认 \['node\_modules', 'node:'\]  
}

**约束**：enableTrace 变更需要重启 Node.js 进程。

### **3.2 双层拦截模型 (Dual-Layer Interception)**

#### **Layer 1: 核心模块层 (Node.js Core)**

针对标准 HTTP/HTTPS/HTTP2 协议，拦截 createServer 的 requestListener。

* **目标模块**: http, https, http2。  
* **拦截策略**: **Listener Wrapping** (优于 emit 劫持)。  
  * 代理 http.createServer((req, res) \=\>...)。  
  * 将用户传入的 callback 包裹在 AsyncLocalStorage.run() 上下文中执行。  
  * **处理多 Listener 边界情况**: 若用户多次调用 server.on('request',...)，仅首个 Listener 负责初始化上下文，后续 Listener 自动继承该上下文。

#### **Layer 2: 框架适配层 (Framework Adapters)**

针对 Fastify 及其生态（NestJS Fastify Adapter）的特殊处理。Fastify 内部会对 req/res 对象进行封装并在某些阶段脱离原生上下文。

* **检测机制**: 启动时扫描 require.cache 或检查是否存在 fastify 实例特征。  
* **补偿策略**: 利用 fastify.addHook('onRequest',...) 显式重新绑定当前 Trace Context，确保后续 Controller 和 Service 逻辑处于正确的 ALS 上下文中。

#### **特殊协议处理**

* **WebSocket**: 仅追踪 **握手阶段 (Upgrade Request)**。WebSocket 建立连接后的 Frame 通信不在本版本追踪范围内（因长连接上下文管理极其复杂且开销巨大）。  
* **HTTP/2**: 基于 Stream 粒度进行追踪。

### **3.3 异步资源追踪与降噪 (Async Hooks & Filtering)**

#### **3.3.1 采集阶段 (Init Phase)**

在 async\_hooks.init 阶段执行**激进过滤**，直接丢弃无效数据以降低内存压力。

* **上下文检查**: 若 storage.getStore() 为空，说明当前操作不属于被追踪的入站请求（可能是系统定时器或后台任务），直接 return。  
* **类型过滤**:  
  * **保留**: TCPWRAP, FSREQCALLBACK, HTTPCLIENTREQUEST, HTTPINCOMINGMESSAGE (关键 I/O)。  
  * **条件保留**: PROMISE, TICKOBJECT (仅当其作为 I/O 操作的父节点或耗时超过阈值时才保留，但在 Init 阶段先记录，后期聚合时剪裁)。  
  * **丢弃**: 与追踪系统自身相关的资源（避免无限递归）。

#### **3.3.2 熔断机制**

* 维护一个 nodesCount 计数器。  
* 当单请求节点数 \> maxNodesPerRequest (e.g., 5000\) 时，停止该请求的后续采集，并在根节点标记 meta.truncated \= true。

### **3.4 智能堆栈捕获 (Smart Stack Capture)**

调用栈捕获是性能开销最大的环节，采取 **"关键路径采样"** 策略。

* **触发条件**: 仅对 **I/O 资源** (FS, Net) 或 **长耗时任务** 捕获堆栈。普通的 Promise.resolve 不捕获堆栈。  
* **捕获优化**:  
  * 覆盖 Error.prepareStackTrace。  
  * Error.stackTraceLimit \= 5 (限制深度)。  
  * **即时过滤**: 在捕获瞬间过滤掉 node\_modules 和 node: 内部调用栈，只保留用户代码帧。

### **3.5 数据聚合与压缩 (Aggregation & Compaction)**

在 res.on('finish') 触发后，将扁平的 Map 数据转换为树形结构，并执行 **路径压缩算法**。

**压缩规则 (Promise Chain Compaction)**:

如果存在路径 A (Promise) \-\> B (Promise) \-\> C (FS\_REQ)：

1. 若 A 到 B 之间耗时极短 (\< 1ms) 且无其他分支，则**折叠** A 和 B，直接将 C 挂载到 A 的父节点下（或视觉上隐藏中间层）。  
2. 最终输出的树应只包含：**用户入口函数** \-\> **显著的中间件/Service** \-\> **底层 I/O**。

## ---

**4\. 前端详细设计 (Trace Viewer)**

### **4.1 数据结构 (Hierarchical JSON)**

后端传输给前端的数据结构应兼容或类似于 Chrome Trace Event 格式，或简化版的递归结构：

TypeScript

interface TraceNode {  
  name: string;        // e.g., "fs.readFile", "UserService.getUser"  
  type: string;        // e.g., "FS", "HTTP", "JS"  
  value: number;       // Duration (microseconds)  
  children: TraceNode;  
  detail?: {  
    file: string;  
    line: number;  
    stack: string;  
  };  
}

### **4.2 可视化交互**

* **Flame Graph 组件**: 集成 react-flame-graph 或类似轻量级库。  
* **"Hide System Noise" 开关**:  
  * **OFF**: 显示完整调用链（包含 Promise 胶水层），用于底层调试。  
  * **ON (默认)**: 仅显示 I/O 节点和耗时 \> 1ms 的业务逻辑节点。  
* **侧边栏**: 点击节点展示完整堆栈信息和自身耗时 (Self Time) vs 总耗时 (Total Time)。

## ---

**5\. 兼容性与限制矩阵**

| 框架/协议 | 兼容性支持 | 备注 |
| :---- | :---- | :---- |
| **Express / Koa** | ✅ 完全支持 | 基于 Layer 1 拦截 |
| **Fastify** | ✅ 支持 | 需依赖 Layer 2 (Hook) 适配 |
| **NestJS (Express)** | ✅ 完全支持 | 同 Express |
| **NestJS (Fastify)** | ⚠️ Best-Effort | 依赖 Fastify Adapter 的 Hook 机制 |
| **WebSocket** | ⚠️ 部分支持 | 仅握手阶段 (Handshake)，不追踪 Frames |
| **HTTP/2** | ✅ 支持 | 基于 Stream 追踪 |
| **GraphQL** | ✅ 支持 | 视为普通的 HTTP 请求 |

## ---

**6\. 风险声明与边界 (Red Lines)**

开发与使用过程中需严格遵守以下边界：

1. **非生产环境工具 (Not for Production)**:  
   * 本扩展深度依赖 async\_hooks 和堆栈捕获，启用后会显著增加 CPU 占用和请求延迟。严禁在生产环境开启。  
2. **非 CPU Profiler**:  
   * 本工具关注的是“异步调用链路”和“I/O 等待”，而非微秒级的 CPU 指令分析。如需分析 CPU 密集型算法瓶颈，请使用 V8 Inspector Profiler。  
3. **非标准 APM**:  
   * 不提供分布式追踪 (Distributed Tracing) 的跨服务 Context Propagation (如 B3 Headers 注入)，仅关注单进程内的全链路。  
4. **性能预期**:  
   * 开启追踪后，请求吞吐量 (RPS) 可能会下降 30%\~50%，P99 延迟可能显著增加。这是获取高精度调试信息的必要代价。

## ---

**7\. 实施路线图 (Implementation Roadmap)**

* **阶段 1: 核心拦截与上下文 (Core)**  
  * 实现 TraceManager 单例与配置加载。  
  * 完成 http/https 的 requestListener 包装器。  
  * 集成 AsyncLocalStorage 并在请求入口初始化 Store。  
* **阶段 2: 数据采集 (Collector)**  
  * 实现 async\_hooks 监听与资源生命周期管理。  
  * 实现基于 Error.prepareStackTrace 的高性能堆栈捕获。  
  * 实现内存中的临时数据存储与熔断限制。  
* **阶段 3: 框架适配与聚合 (Adapter & Aggregation)**  
  * 实现 Fastify onRequest Hook 注入逻辑。  
  * 实现 Map \-\> Tree 的转换与 Promise 链压缩算法。  
* **阶段 4: 前端可视化 (UI)**  
  * 扩展 WebSocket 协议传输 Trace 数据。  
  * 在面板中开发 Flame Graph 视图与过滤开关。

---

*End of Document*