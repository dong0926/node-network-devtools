#!/usr/bin/env node

/**
 * 检查 node-network-devtools 版本和修复状态
 * 
 * 用法：
 *   node scripts/check-version.cjs
 *   或在 Next.js 项目中：
 *   node node_modules/@mt0926/node-network-devtools/scripts/check-version.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 node-network-devtools 版本和修复状态...\n');

// 检查是否在 node-network-devtools 项目根目录
const isInProject = fs.existsSync(path.join(__dirname, '../src/interceptors/undici-patcher.ts'));

let patcherPath;
let packagePath;

if (isInProject) {
  // 在项目根目录
  patcherPath = path.join(__dirname, '../dist/esm/interceptors/undici-patcher.js');
  packagePath = path.join(__dirname, '../package.json');
  console.log('📍 位置：node-network-devtools 项目根目录\n');
} else {
  // 在使用该包的项目中
  patcherPath = path.join(__dirname, '../dist/esm/interceptors/undici-patcher.js');
  packagePath = path.join(__dirname, '../package.json');
  console.log('📍 位置：node_modules 中的安装包\n');
}

// 检查文件是否存在
if (!fs.existsSync(patcherPath)) {
  console.error('❌ 错误：找不到 undici-patcher.js');
  console.error('   路径：', patcherPath);
  console.error('\n💡 提示：请先运行 pnpm build 构建项目');
  process.exit(1);
}

if (!fs.existsSync(packagePath)) {
  console.error('❌ 错误：找不到 package.json');
  process.exit(1);
}

// 读取版本号
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
const version = packageJson.version;

console.log(`📦 版本：${version}\n`);

// 读取 patcher 文件内容
const content = fs.readFileSync(patcherPath, 'utf-8');

// 检查修复
const checks = [
  {
    name: 'URL 重复拼接修复',
    pattern: /path\.startsWith\('http:\/\/'\) \|\| path\.startsWith\('https:\/\/'\)/,
    description: '检查是否包含代理场景的 URL 处理逻辑',
    fixDate: '2026-01-17',
    issueFile: 'BUGFIX-URL-DUPLICATION.md'
  }
];

console.log('🔧 修复状态检查：\n');

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.pattern.test(content);
  const status = passed ? '✅' : (check.optional ? '⚠️' : '❌');
  const label = passed ? '已修复' : (check.optional ? '未应用（可选）' : '未修复');
  
  console.log(`${index + 1}. ${check.name}`);
  console.log(`   ${status} ${label}`);
  console.log(`   说明：${check.description}`);
  if (!passed && !check.optional) {
    console.log(`   修复日期：${check.fixDate}`);
    console.log(`   相关文档：${check.issueFile}`);
    allPassed = false;
  }
  console.log('');
  
  if (!passed && !check.optional) {
    allPassed = false;
  }
});

// 总结
console.log('━'.repeat(60));
console.log('');

if (allPassed) {
  console.log('✅ 所有修复已应用！');
  console.log('');
  console.log('💡 如果仍然遇到问题：');
  console.log('   1. 清理缓存：rm -rf .next node_modules');
  console.log('   2. 重新安装：pnpm install');
  console.log('   3. 重启服务器：pnpm dev');
  console.log('');
  console.log('📚 故障排查文档：');
  console.log('   - TROUBLESHOOT-URL-DUPLICATION.md');
  console.log('   - VERIFY-WEBPACK-FIX.md');
} else {
  console.log('❌ 发现未修复的问题！');
  console.log('');
  console.log('🔧 解决方案：');
  console.log('');
  if (isInProject) {
    console.log('   1. 重新构建项目：');
    console.log('      pnpm build');
    console.log('');
    console.log('   2. 如果使用 pnpm link，在使用该包的项目中：');
    console.log('      rm -rf node_modules/.pnpm');
    console.log('      pnpm install');
  } else {
    console.log('   1. 更新到最新版本：');
    console.log('      pnpm update @mt0926/node-network-devtools');
    console.log('');
    console.log('   2. 清理缓存：');
    console.log('      rm -rf .next node_modules');
    console.log('      pnpm install');
  }
  console.log('');
  console.log('📚 详细文档：');
  checks.forEach(check => {
    if (!check.pattern.test(content) && !check.optional) {
      console.log(`   - ${check.issueFile}`);
    }
  });
  process.exit(1);
}

console.log('');
