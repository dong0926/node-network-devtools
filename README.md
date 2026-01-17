<div align="center">

# 🔍 Node Network DevTools

**Monitor Node.js network requests with Chrome DevTools integration and built-in Web GUI**

[![npm version](https://img.shields.io/npm/v/node-network-devtools.svg)](https://www.npmjs.com/package/node-network-devtools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/node-network-devtools.svg)](https://nodejs.org)

[English](#) | [中文文档](./README.zh-CN.md)

</div>

---

## ✨ Features

- 🔍 **Dual Interception** - Supports both `http/https` modules and `undici/fetch` API
- 🎯 **Zero Intrusion** - Auto-inject via `-r` or `--import`, no code changes needed
- 📊 **DevTools Integration** - View all requests in Chrome DevTools Network panel
- 🖥️ **Built-in Web GUI** - Chrome DevTools-like interface with real-time updates
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
npm install node-network-devtools
# or
pnpm add node-network-devtools
# or
yarn add node-network-devtools
```

### Usage

#### Method 1: CLI (Recommended)

```bash
npx node-network-devtools your-script.js
# or use the short alias
npx nnd your-script.js
```

The CLI automatically adds the `--inspect` flag and injects the interceptor.

#### Method 2: Using `-r` flag

```bash
node --inspect -r node-network-devtools/register your-script.js
```

#### Method 3: Programmatic

```typescript
import { install } from 'node-network-devtools';

await install();

// Your application code
import express from 'express';
const app = express();
// ...
```

### Viewing Requests

After starting your application:

1. **Web GUI** (Default): A browser window will automatically open showing the GUI
2. **Chrome DevTools**: Open Chrome and navigate to `chrome://inspect`, then click "Open dedicated DevTools for Node"

## 🖥️ Web GUI

The built-in Web GUI provides a Chrome DevTools-like experience for monitoring network requests.

### Features

- 📋 **Request List** - Real-time display of all network requests
- 🔍 **Search & Filter** - Filter by URL, method, status code, and type
- 📝 **Details Panel** - View headers, payload, response, and timing
- 🎨 **Theme Toggle** - Dark/Light theme support
- ⏸️ **Pause/Resume** - Pause request capture for analysis
- 🔄 **Real-time Updates** - WebSocket-based live updates

### GUI Configuration

```bash
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
| `NND_AUTO_CONNECT` | Auto-connect to CDP | true |

#### GUI Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `NND_GUI_ENABLED` | Enable GUI server | true |
| `NND_GUI_PORT` | GUI server port | auto |
| `NND_WS_PORT` | WebSocket port | auto |
| `NND_AUTO_OPEN` | Auto-open browser | true |

### Programmatic Configuration

```typescript
import { setConfig } from 'node-network-devtools';

setConfig({
  maxRequests: 500,
  maxBodySize: 512 * 1024,
  redactHeaders: ['authorization', 'cookie', 'x-api-key'],
  guiEnabled: true,
  autoOpen: false,
});
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

3. Start with `--inspect`:

```bash
NODE_OPTIONS='--inspect' npm run dev
```

Or configure in `package.json`:

```json
{
  "scripts": {
    "dev:debug": "NODE_OPTIONS='--inspect' next dev"
  }
}
```

### Express

```typescript
import express from 'express';
import { install } from 'node-network-devtools';

await install();

const app = express();
// Your routes...
```

### Other Frameworks

Works with any Node.js framework! Just install the interceptor before your application code.

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

// CDP Bridge
import { getCDPBridge, isInspectorEnabled } from 'node-network-devtools';
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
- [request-tracing](./examples/request-tracing) - Request tracing
- [express-server](./examples/express-server) - Express server example
- [programmatic-api](./examples/programmatic-api) - Programmatic API usage
- [nextjs-app](./examples/nextjs-app) - Next.js App Router integration

## 🔬 How It Works

1. **HTTP Interception**: Uses `@mswjs/interceptors` to intercept http/https module requests
2. **Undici Interception**: Uses `Agent.compose()` to register interceptors for fetch requests
3. **CDP Bridge**: Connects to V8 Inspector via `node:inspector` module and sends Network domain events
4. **Context Propagation**: Uses `AsyncLocalStorage` to pass TraceID through async call chains
5. **Event Bridge**: Forwards intercepted requests to WebSocket clients for real-time GUI updates

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

## 📮 Support

- 🐛 [Report Issues](https://github.com/dong0926/node-network-devtools/issues)
- 💬 [Discussions](https://github.com/dong0926/node-network-devtools/discussions)
- 📧 Email: your.email@example.com

---

<div align="center">

**If you find this project helpful, please give it a ⭐️!**

Made with ❤️ by [ddddd](https://github.com/dong0926)

</div>
