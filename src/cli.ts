#!/usr/bin/env node
/**
 * CLI 入口
 * 
 * 使用方式：npx node-network-devtools your-script.js [args...]
 */

import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 输出帮助信息
 */
function printHelp(): void {
  console.log(`
\x1b[36mnode-network-devtools\x1b[0m - Node.js 网络请求监听工具

\x1b[33m用法:\x1b[0m
  npx node-network-devtools [选项] <脚本> [脚本参数...]

\x1b[33m选项:\x1b[0m
  --help, -h          显示帮助信息
  --version, -v       显示版本号
  --inspect-port=PORT 指定 Inspector 端口（默认: 9229）
  --inspect-brk       在脚本开始时暂停执行
  --gui               启用 Web GUI（默认: false）
  --gui-port=PORT     指定 GUI 端口（默认: auto）
  --ws-port=PORT      指定 WebSocket 端口（默认: auto）
  --no-open           不自动打开浏览器

\x1b[33m示例:\x1b[0m
  npx node-network-devtools server.js
  npx node-network-devtools --gui server.js
  npx node-network-devtools --gui --gui-port=8080 app.js
  npx node-network-devtools --inspect-port=9230 app.js
  npx node-network-devtools --inspect-brk test.js

\x1b[33m环境变量:\x1b[0m
  NND_MAX_REQUESTS      最大存储请求数（默认: 1000）
  NND_MAX_BODY_SIZE     最大 body 大小（默认: 1048576）
  NND_INTERCEPT_HTTP    是否拦截 http/https（默认: true）
  NND_INTERCEPT_UNDICI  是否拦截 undici/fetch（默认: true）
  NND_REDACT_HEADERS    要脱敏的头（逗号分隔，默认: authorization,cookie）
  NND_GUI_ENABLED       是否启用 GUI（默认: false）
  NND_GUI_PORT          GUI 端口（默认: auto）
  NND_WS_PORT           WebSocket 端口（默认: auto）
  NND_AUTO_OPEN         是否自动打开浏览器（默认: true）

\x1b[33m说明:\x1b[0m
  此工具会自动添加 --inspect 和 --experimental-network-inspection 标志。
  启动后，打开 Chrome DevTools (chrome://inspect) 即可查看网络请求。
  使用 --gui 选项可以启用内置的 Web GUI 界面。

\x1b[33m注意:\x1b[0m
  Network 面板功能需要 Node.js 20.18.0+ 版本。
  Chrome DevTools Network 面板目前可能还不支持显示这些事件。
  请求数据仍会被捕获并可通过编程 API 或控制台日志访问。
`);
}

/**
 * 输出版本号
 */
function printVersion(): void {
  // 从 package.json 读取版本号
  console.log('0.1.0');
}

/**
 * 解析命令行参数
 */
interface ParsedArgs {
  help: boolean;
  version: boolean;
  inspectPort: number;
  inspectBrk: boolean;
  gui: boolean;
  guiPort: number | 'auto';
  wsPort: number | 'auto';
  autoOpen: boolean;
  script: string | null;
  scriptArgs: string[];
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    help: false,
    version: false,
    inspectPort: 9229,
    inspectBrk: false,
    gui: false,
    guiPort: 'auto',
    wsPort: 'auto',
    autoOpen: true,
    script: null,
    scriptArgs: [],
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.version = true;
    } else if (arg === '--inspect-brk') {
      result.inspectBrk = true;
    } else if (arg.startsWith('--inspect-port=')) {
      result.inspectPort = parseInt(arg.split('=')[1], 10) || 9229;
    } else if (arg === '--gui') {
      result.gui = true;
    } else if (arg.startsWith('--gui-port=')) {
      const port = parseInt(arg.split('=')[1], 10);
      result.guiPort = isNaN(port) ? 'auto' : port;
    } else if (arg.startsWith('--ws-port=')) {
      const port = parseInt(arg.split('=')[1], 10);
      result.wsPort = isNaN(port) ? 'auto' : port;
    } else if (arg === '--no-open') {
      result.autoOpen = false;
    } else if (!arg.startsWith('-')) {
      // 第一个非选项参数是脚本路径
      result.script = arg;
      result.scriptArgs = args.slice(i + 1);
      break;
    }

    i++;
  }

  return result;
}


/**
 * 主函数
 */
function main(): void {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (parsed.help) {
    printHelp();
    process.exit(0);
  }

  if (parsed.version) {
    printVersion();
    process.exit(0);
  }

  if (!parsed.script) {
    console.error('\x1b[31m错误:\x1b[0m 请指定要运行的脚本');
    console.error('使用 --help 查看帮助信息');
    process.exit(1);
  }

  // 解析脚本路径
  const scriptPath = resolve(process.cwd(), parsed.script);

  // 构建 Node.js 参数
  const nodeArgs: string[] = [];

  // 添加 inspect 标志
  if (parsed.inspectBrk) {
    nodeArgs.push(`--inspect-brk=${parsed.inspectPort}`);
  } else {
    nodeArgs.push(`--inspect=${parsed.inspectPort}`);
  }

  // 添加实验性网络检查标志（Node.js 20.18.0+）
  nodeArgs.push('--experimental-network-inspection');

  // 添加 register 入口
  // 计算 register.js 的路径（相对于 CLI 脚本）
  const registerPath = resolve(__dirname, 'register.js');
  nodeArgs.push('--import', registerPath);

  // 添加用户脚本和参数
  nodeArgs.push(scriptPath, ...parsed.scriptArgs);

  // 设置 GUI 相关环境变量
  const env = { ...process.env };
  if (parsed.gui) {
    env.NND_GUI_ENABLED = 'true';
    if (parsed.guiPort !== 'auto') {
      env.NND_GUI_PORT = String(parsed.guiPort);
    }
    if (parsed.wsPort !== 'auto') {
      env.NND_WS_PORT = String(parsed.wsPort);
    }
    env.NND_AUTO_OPEN = parsed.autoOpen ? 'true' : 'false';
  }

  console.log(`\x1b[36m[node-network-devtools]\x1b[0m 启动脚本: ${parsed.script}`);
  console.log(`\x1b[36m[node-network-devtools]\x1b[0m Inspector 端口: ${parsed.inspectPort}`);
  console.log(`\x1b[36m[node-network-devtools]\x1b[0m 实验性网络检查已启用`);
  if (parsed.gui) {
    console.log(`\x1b[36m[node-network-devtools]\x1b[0m Web GUI 已启用`);
  } else {
    console.log(`\x1b[36m[node-network-devtools]\x1b[0m 打开 chrome://inspect 查看网络请求`);
  }
  console.log('');

  // 启动子进程
  const child = spawn('node', nodeArgs, {
    stdio: 'inherit',
    env,
  });

  // 转发退出码
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  // 处理错误
  child.on('error', (error) => {
    console.error(`\x1b[31m错误:\x1b[0m 无法启动脚本: ${error.message}`);
    process.exit(1);
  });

  // 处理信号
  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
}

main();
