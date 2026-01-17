#!/usr/bin/env node

/**
 * 检查 Puppeteer 是否已安装
 * 如果未安装，提供友好的安装提示
 */

function checkPuppeteer() {
  try {
    require.resolve('puppeteer');
    console.log('[node-network-devtools] ✓ Puppeteer 已安装');
    return true;
  } catch (err) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Node Network DevTools - Puppeteer 未安装                      ║
╚════════════════════════════════════════════════════════════════╝

本工具使用 Puppeteer 提供极简的浏览器窗口体验。

推荐安装 Puppeteer：
  pnpm add puppeteer
  # 或
  npm install puppeteer
  # 或
  yarn add puppeteer

如果您不需要自动打开浏览器，可以：
1. 禁用自动打开：NND_AUTO_OPEN=false
2. 完全禁用 GUI：NND_GUI_ENABLED=false
3. 手动访问 GUI：http://127.0.0.1:PORT

注意：本工具仅用于开发环境，不推荐在生产环境使用。
    `);
    return false;
  }
}

// 只在非 CI 环境中显示提示
if (!process.env.CI) {
  checkPuppeteer();
}
