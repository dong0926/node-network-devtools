<div align="center">

# 🔍 Node Network DevTools

**A powerful, zero-config network debugging companion for Node.js.**  
*Monitor all outgoing HTTP, HTTPS, and Fetch/Undici requests in a sleek, real-time Web GUI that feels just like Chrome DevTools.*

[![npm version](https://img.shields.io/npm/v/@mt0926/node-network-devtools.svg)](https://www.npmjs.com/package/@mt0926/node-network-devtools)
[![CI](https://github.com/dong0926/node-network-devtools/actions/workflows/ci.yml/badge.svg)](https://github.com/dong0926/node-network-devtools/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/dong0926/node-network-devtools/branch/master/graph/badge.svg)](https://codecov.io/gh/dong0926/node-network-devtools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/node-network-devtools.svg)](https://nodejs.org)

[English](#) | [中文文档](./README.zh-CN.md)

</div>

---

## 🚀 Why Node Network DevTools?

Tired of `console.log`ing every request and response? **Node Network DevTools** brings the familiarity of the browser's "Network" tab to your Node.js backend. Whether you're debugging external API calls, microservices, or Next.js server actions, you can now inspect every detail in real-time.

## ✨ Features

- 💎 **DevTools-like Experience** - A familiar, responsive Web GUI for inspecting headers, payloads, and responses.
- 🔌 **Universal Interception** - Native support for `http/https` modules and modern `fetch/undici` (Node.js 18+).
- 🛠️ **Zero Code Intrusion** - Plug it into your project with a single line of code or a simple CLI flag.
- 🖥️ **Minimal Browser Window** - Automatically launches a compact, app-mode GUI window (using your system's Chrome, Edge, or Chromium).
- 🔗 **Smart Request Tracing** - Automatically correlate related requests in a single business flow using `AsyncLocalStorage`.
- 🛡️ **Built-in Redaction** - Keeps your secrets safe by auto-redacting sensitive headers like `Authorization` and `Cookie`.
- ⚡ **Framework Ready** - Seamless integration with Next.js, Express, Fastify, and more.
- 📦 **Dual Module Support** - Works out of the box with both **ESM** and **CommonJS**.

## 📸 Screenshots

### Web GUI Interface
![Web GUI](https://via.placeholder.com/800x450?text=Web+GUI+Screenshot)

## 🚀 Quick Start

### 1. Installation

```bash
npm install @mt0926/node-network-devtools
# or
pnpm add @mt0926/node-network-devtools
```

> **Note**: No extra dependencies like Puppeteer are required! It uses your system's existing browser.

### 2. Usage (Recommended)

Just call `install()` at the very beginning of your application entry point.

**ESM:**
```typescript
import { install } from '@mt0926/node-network-devtools';

await install(); // Call before any other imports that make network requests
```

**CommonJS:**
```javascript
const { install } = require('@mt0926/node-network-devtools');

(async () => {
  await install();
})();
```

### 3. Advanced: Zero-Code Injection

If you don't want to modify your source code, you can use Node.js CLI arguments to inject the tool.

**ESM:**
```bash
node --import @mt0926/node-network-devtools/register your-script.js
```

**CommonJS:**
```bash
node -r @mt0926/node-network-devtools/register your-script.js
```

## 🖥️ Web GUI

Once started, a minimal browser window will automatically open showing the real-time request list.

- **Compact size** (800x600) for side-by-side debugging.
- **Search & Filter** by URL, method, or status.
- **Details Panel** for headers, payload, and response.
- **Dark/Light** theme support.

If you need to access it manually, check the console output for the URL:
`🚀 Node Network DevTools GUI started at http://localhost:9229`

### GUI Configuration

```bash
# Customize window size
NND_BROWSER_WIDTH=1024 NND_BROWSER_HEIGHT=768 node --import @mt0926/node-network-devtools/register your-script.js

# Customize window title
NND_BROWSER_TITLE="My App Network Monitor" node --import @mt0926/node-network-devtools/register your-script.js

# Specify GUI port
NND_GUI_PORT=9230 node --import @mt0926/node-network-devtools/register your-script.js

# Specify WebSocket port
NND_WS_PORT=9231 node --import @mt0926/node-network-devtools/register your-script.js

# Disable GUI
NND_GUI_ENABLED=false node --import @mt0926/node-network-devtools/register your-script.js

# Disable auto-open browser
NND_AUTO_OPEN=false node --import @mt0926/node-network-devtools/register your-script.js
```

## 🔧 Configuration

### Environment Variables

#### Core Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `NND_MAX_REQUESTS` | Maximum stored requests | 1000 |
| `NND_MAX_BODY_SIZE` | Maximum body size (bytes) | 1048576 (1MB) |
| `NND_INTERCEPT_HTTP` | Intercept http/https | true |
| `NND_INTERCEPT_UNDICI` | Intercept undici/fetch | true |
| `NND_REDACT_HEADERS` | Headers to redact (comma-separated) | authorization,cookie |

#### GUI Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `NND_GUI_ENABLED` | Enable GUI server | true |
| `NND_GUI_PORT` | GUI server port | auto |
| `NND_WS_PORT` | WebSocket port | auto |
| `NND_AUTO_OPEN` | Auto-open browser | true |
| `NND_BROWSER_WIDTH` | Browser window width | 800 |
| `NND_BROWSER_HEIGHT` | Browser window height | 600 |
| `NND_BROWSER_TITLE` | Browser window title | Node Network DevTools |

### Programmatic Configuration

```typescript
import { setConfig } from '@mt0926/node-network-devtools';

setConfig({
  maxRequests: 500,
  maxBodySize: 512 * 1024,
  redactHeaders: ['authorization', 'cookie', 'x-api-key'],
  guiEnabled: true,
  autoOpen: false,
  browserWindowSize: { width: 1024, height: 768 },
  browserWindowTitle: 'My App Network Monitor',
});
```

### Disabling in Production

**Important**: Always disable this tool in production environments!

```typescript
// Conditional installation based on environment
if (process.env.NODE_ENV === 'development') {
  const { install } = await import('@mt0926/node-network-devtools');
  await install();
}
```

Or use environment variables:

```bash
# In production, disable GUI and auto-open
NODE_ENV=production NND_GUI_ENABLED=false NND_AUTO_OPEN=false node your-app.js
```

## 🎯 Framework Integration

### Next.js

1. Copy `templates/instrumentation.ts` to your project root
2. Enable instrumentation in `next.config.js`:

```javascript
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

3. Start your development server:

```bash
npm run dev
```

Or configure in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev"
  }
}
```

**Note**: The tool will automatically start when Next.js loads the instrumentation hook.

### Express

**ESM:**
```typescript
import express from 'express';
import { install } from '@mt0926/node-network-devtools';

await install();

const app = express();
// Your routes...
```

**CommonJS:**
```javascript
const express = require('express');
const { install } = require('@mt0926/node-network-devtools');

(async () => {
  await install();
  
  const app = express();
  // Your routes...
})();
```

### Other Frameworks

Works with any Node.js framework! Just install the interceptor before your application code.

## 📦 Module System Support

This package supports both **ESM (ECMAScript Modules)** and **CommonJS** module systems, making it compatible with all Node.js projects.

### ESM (ECMAScript Modules)

Use `import` statements in projects with `"type": "module"` in package.json or `.mjs` files:

```typescript
import { install, getRequestStore } from '@mt0926/node-network-devtools';
import '@mt0926/node-network-devtools/register';

await install();
const store = getRequestStore();
```

### CommonJS

Use `require()` statements in traditional Node.js projects or `.cjs` files:

```javascript
const { install, getRequestStore } = require('@mt0926/node-network-devtools');
require('@mt0926/node-network-devtools/register');

(async () => {
  await install();
  const store = getRequestStore();
})();
```

### TypeScript

Full TypeScript support with type definitions for both module systems:

```typescript
import type { Config, IRequestStore } from '@mt0926/node-network-devtools';
import { install, getRequestStore } from '@mt0926/node-network-devtools';

const config: Config = {
  maxRequests: 500,
  guiEnabled: true,
};

await install();
const store: IRequestStore = getRequestStore();
```

### Module Resolution

The package uses Node.js [Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports) to automatically provide the correct module format:

- **ESM projects**: Resolves to `dist/esm/index.js`
- **CommonJS projects**: Resolves to `dist/cjs/index.js`
- **TypeScript**: Uses `dist/types/index.d.ts` for both

No configuration needed - it just works! 🎉

## 📚 API Reference

### Main Exports

```typescript
// Quick install
import { install, startGUI, stopGUI } from '@mt0926/node-network-devtools';

// Configuration
import { getConfig, setConfig, resetConfig } from '@mt0926/node-network-devtools';

// Request store
import { getRequestStore } from '@mt0926/node-network-devtools';

// Context tracing
import { 
  runWithTrace, 
  getCurrentTraceId,
  generateTraceId 
} from '@mt0926/node-network-devtools';

// Interceptors
import { HttpPatcher, UndiciPatcher } from '@mt0926/node-network-devtools';
```

### Request Tracing

Correlate multiple requests in the same business flow:

```typescript
import { runWithTrace, getRequestStore } from '@mt0926/node-network-devtools';

await runWithTrace('user-login', async () => {
  // These requests will be correlated with the same traceId
  await fetch('https://api.example.com/auth');
  await fetch('https://api.example.com/user');
});

// Query correlated requests
const store = getRequestStore();
const requests = store.getByTraceId('user-login');
```

## 📖 Examples

Check the [examples](./examples) directory for more usage examples:

- [basic-http](./examples/basic-http) - Basic HTTP request monitoring
- [fetch-api](./examples/fetch-api) - Fetch API monitoring
- [commonjs-usage](./examples/commonjs-usage) - CommonJS module usage
- [request-tracing](./examples/request-tracing) - Request tracing
- [express-server](./examples/express-server) - Express server example
- [programmatic-api](./examples/programmatic-api) - Programmatic API usage
- [nextjs-app](./examples/nextjs-app) - Next.js App Router integration

## 🔬 How It Works

1. **HTTP Interception**: Uses `@mswjs/interceptors` to intercept http/https module requests
2. **Undici Interception**: Uses `Agent.compose()` to register interceptors for fetch requests
3. **Context Propagation**: Uses `AsyncLocalStorage` to pass TraceID through async call chains
4. **Event Bridge**: Forwards intercepted requests to WebSocket clients for real-time GUI updates
5. **Native Browser Launch**: Detects and launches your system's browser (Chrome/Edge/Chromium) in a dedicated app-mode window.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/dong0926/node-network-devtools.git
cd node-network-devtools

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test:all
```

## 📝 License

MIT © [ddddd](https://github.com/dong0926)

## 🙏 Acknowledgments

- [@mswjs/interceptors](https://github.com/mswjs/interceptors) - HTTP request interception
- [undici](https://github.com/nodejs/undici) - HTTP/1.1 client
- [ws](https://github.com/websockets/ws) - WebSocket implementation
- [puppeteer](https://github.com/puppeteer/puppeteer) - Browser automation

## 📮 Support

- 🐛 [Report Issues](https://github.com/dong0926/node-network-devtools/issues)
- 💬 [Discussions](https://github.com/dong0926/node-network-devtools/discussions)
- 📧 Email: xx630133368@gmail.com

---

<div align="center">

**If you find this project helpful, please give it a ⭐️!**

Made with ❤️ by [ddddd](https://github.com/dong0926)

</div>
