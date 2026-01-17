#!/usr/bin/env node

/**
 * 更新项目中的占位符信息
 * 使用方法：node scripts/update-placeholders.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 提示用户输入
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 需要更新的文件列表
const filesToUpdate = [
  'package.json',
  'LICENSE',
  'README.md',
  'README.zh-CN.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'PUBLISH.md',
  'SECURITY.md',
  'FAQ.md',
  'QUICKSTART.md',
  '.github/CODEOWNERS',
];

// 替换文件中的占位符
function replaceInFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder, 'g');
      if (content.includes(placeholder)) {
        content = content.replace(regex, value);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 已更新: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  跳过: ${filePath} (无需更新)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 错误: ${filePath} - ${error.message}`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 Node Network DevTools - 占位符更新工具\n');
  console.log('此工具将帮助你更新项目中的所有占位符信息。\n');

  // 收集用户信息
  const username = await question('GitHub 用户名: ');
  const name = await question('你的名字: ');
  const email = await question('你的邮箱: ');

  console.log('\n确认信息：');
  console.log(`  GitHub 用户名: ${username}`);
  console.log(`  名字: ${name}`);
  console.log(`  邮箱: ${email}`);

  const confirm = await question('\n确认更新？(y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ 已取消');
    rl.close();
    return;
  }

  console.log('\n开始更新文件...\n');

  // 准备替换映射
  const replacements = {
    'yourusername': username,
    'Your Name': name,
    'your\\.email@example\\.com': email,
  };

  // 更新文件
  let updatedCount = 0;
  for (const file of filesToUpdate) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      if (replaceInFile(filePath, replacements)) {
        updatedCount++;
      }
    } else {
      console.log(`⚠️  文件不存在: ${file}`);
    }
  }

  console.log(`\n✨ 完成！共更新 ${updatedCount} 个文件。\n`);

  // 提醒用户后续步骤
  console.log('📋 后续步骤：');
  console.log('  1. 检查更新的文件，确保信息正确');
  console.log('  2. 添加实际的截图（替换占位符图片）');
  console.log('  3. 运行测试：pnpm test:all');
  console.log('  4. 构建项目：pnpm build');
  console.log('  5. 查看 TODO-BEFORE-PUBLISH.md 了解完整的发布清单\n');

  rl.close();
}

// 运行
main().catch((error) => {
  console.error('❌ 发生错误:', error);
  rl.close();
  process.exit(1);
});
