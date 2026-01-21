## ADDED Requirements

### Requirement: Fixed-size Ring Buffer
系统 SHALL 使用固定大小的环形缓冲区存储请求数据，以防止内存无限增长。

#### Scenario: Buffer rotation
- **WHEN** 存储的请求数量达到配置的 `maxRequests` 上限
- **THEN** 新请求应当覆盖最旧的请求数据

### Requirement: Body Size Limitation
系统 MUST 限制存储的请求/响应 Body 的最大字节数。

#### Scenario: Truncate large body
- **WHEN** 请求或响应的 Body 超过 `maxBodySize`
- **THEN** 存储的数据应被截断，并标记为已截断
