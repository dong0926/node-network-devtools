<div align="center">

# 🔍 Node Network DevTools

**Monitor Node.js network requests with Chrome DevTools integration and built-in Web GUI**

[![npm version](https://img.shields.io/npm/v/node-network-devtools.svg)](https://www.npmjs.com/package/@mt0926/node-network-devtools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/node-network-devtools.svg)](https://nodejs.org)

[English](#) | [中文文档](./README.zh-CN.md)

</div>

---

## ⚠️ Development Tool Only

**This tool is designed for development environments only. Do NOT use in production!**

- Uses Puppeteer to launch a minimal browser window for the GUI
- Intercepts all network requests which may impact performance
- Stores request/response data in memory
- Not suitable for production workloads

### Disabling in Production

```javascript
// Conditional installation
if (process.env.NODE_ENV === 'development') {
  await install();
}
```

Or use environment variables:

```bash
# Disable GUI and auto-open
NND_GUI_ENABLED=false NND_AUTO_OPEN=false node your-app.js
```

## ✨ Features

- 🔍 **Dual Interception** - Supports both `http/https` modules and `undici/fetch` API
- 🎯 **Zero Intrusion** - Auto-inject via `-r` or `--import`, no code changes needed
- 🖥️ **Minimal Browser Window** - Puppeteer-powered compact GUI window (800x600)
- 📊 **Built-in Web GUI** - Chrome DevTools-like interface with real-time updates
- 🔗 **Request Tracing** - AsyncLocalStorage-based request correlation
- 🛡️ **Security** - Auto-redact sensitive headers (Authorization, Cookie, etc.)
- ⚡ **Next.js Compatible** - Preserves `next.revalidate`, `next.tags` options
- 📦 **TypeScript** - Full TypeScript support with type definitions

## 📸 Screenshots

### Web GUI Interface
![Web GUI](https://via.placeholder.com/800x450?text=Web+GUI+Screenshot)

### Chrome DevTools Integration
![Chrome DevTools](https://via.placeholder.com/800x450?text=Chrome+DevTools+Screenshot)

## 🚀 Quick Start

### Installation

```bash
npm install node-network-devtools puppeteer
# or
pnpm add node-network-devtools puppeteer
# or
yarn add node-network-devtools puppeteer
```

**Note**: 
- Puppeteer is required for the GUI browser window. If not installed, you'll see a friendly error message with installation instructions.
- This package supports both **ESM** and **CommonJS** module systems. See [Module System Support](#module-system-support) for details.

### Usage

#### Method 1: CLI (Recommended)

```bash
npx node-network-devtools your-script.js
# or use the short alias
npx nnd your-script.js
```

The CLI automatically injects the interceptor and opens the GUI.

#### Method 2: Using `-r` flag

**ESM:**
```bash
node --import node-network-devtools/register your-script.js
```

**CommonJS:**
```bash
node -r node-network-devtools/register your-script.js
```

#### Method 3: Programmatic

**ESM:**
```typescript
import { install } from 'node-network-devtools';

await install();

// Your application code
import express from 'express';
const app = express();
// ...
```

**CommonJS:**
```javascript
const { install } = require('node-network-devtools');

(async () => {
  await install();

  // Your application code
  const express = require('express');
  const app = express();
  // ...
})();
```

### Viewing Requests

After starting your application:

- **Web GUI** (Default): A minimal browser window will automatically open showing the GUI
  - Compact window size (800x600 by default)
  - Customizable window size and title
  - No browser chrome or toolbars (app mode)

To manually access the GUI, look for the URL in the console output:
```
🚀 Node Network DevTools GUI started at http://localhost:9229
```

## 🖥️ Web GUI

The built-in Web GUI provides a Chrome DevTools-like experience for monitoring network requests.

### Minimal Browser Window

The GUI opens in a minimal Puppeteer-controlled browser window:

- **Compact Size**: Default 800x600, customizable via environment variables
- **App Mode**: No browser chrome, toolbars, or address bar
- **Custom Title**: Shows "Node Network DevTools" by default
- **Fast Launch**: Opens in under 3 seconds

### Features

- 📋 **Request List** - Real-time display of all network requests
- 🔍 **Search & Filter** - Filter by URL, method, status code, and type
- 📝 **Details Panel** - View headers, payload, response, and timing
- 🎨 **Theme Toggle** - Dark/Light theme support
- ⏸️ **Pause/Resume** - Pause request capture for analysis
- 🔄 **Real-time Updates** - WebSocket-based live updates

### GUI Configuration

```bash
# Customize window size
NND_BROWSER_WIDTH=1024 NND_BROWSER_HEIGHT=768 npx nnd your-script.js

# Customize window title
NND_BROWSER_TITLE="My App Network Monitor" npx nnd your-script.js

# Specify GUI port
NND_GUI_PORT=9230 npx nnd your-script.js

# Specify WebSocket port
NND_WS_PORT=9231 npx nnd your-script.js

# Disable GUI
NND_GUI_ENABLED=false npx nnd your-script.js

# Disable auto-open browser
NND_AUTO_OPEN=false npx nnd your-script.js
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
import { setConfig } from 'node-network-devtools';

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
  const { install } = await import('node-network-devtools');
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
import { install } from 'node-network-devtools';

await install();

const app = express();
// Your routes...
```

**CommonJS:**
```javascript
const express = require('express');
const { install } = require('node-network-devtools');

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
import { install, getRequestStore } from 'node-network-devtools';
import 'node-network-devtools/register';

await install();
const store = getRequestStore();
```

### CommonJS

Use `require()` statements in traditional Node.js projects or `.cjs` files:

```javascript
const { install, getRequestStore } = require('node-network-devtools');
require('node-network-devtools/register');

(async () => {
  await install();
  const store = getRequestStore();
})();
```

### TypeScript

Full TypeScript support with type definitions for both module systems:

```typescript
import type { Config, IRequestStore } from 'node-network-devtools';
import { install, getRequestStore } from 'node-network-devtools';

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
import { install, startGUI, stopGUI } from 'node-network-devtools';

// Configuration
import { getConfig, setConfig, resetConfig } from 'node-network-devtools';

// Request store
import { getRequestStore } from 'node-network-devtools';

// Context tracing
import { 
  runWithTrace, 
  getCurrentTraceId,
  generateTraceId 
} from 'node-network-devtools';

// Interceptors
import { HttpPatcher, UndiciPatcher } from 'node-network-devtools';
```

### Request Tracing

Correlate multiple requests in the same business flow:

```typescript
import { runWithTrace, getRequestStore } from 'node-network-devtools';

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
5. **Minimal Browser**: Uses Puppeteer to launch a compact browser window in app mode

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
- 📧 Email: your.email@example.com

---

<div align="center">

**If you find this project helpful, please give it a ⭐️!**

Made with ❤️ by [ddddd](https://github.com/dong0926)

</div>
