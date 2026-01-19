#!/usr/bin/env node

/**
 * 创建 dist/cjs/package.json 文件
 * 用于标识 CommonJS 模块类型
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetPath = join(__dirname, '../dist/cjs/package.json');
const content = JSON.stringify({ type: 'commonjs' }, null, 2) + '\n';

try {
  // 确保目录存在
  mkdirSync(dirname(targetPath), { recursive: true });
  
  // 写入文件
  writeFileSync(targetPath, content, 'utf-8');
  
  console.log('✅ Created dist/cjs/package.json');
} catch (error) {
  console.error('❌ Failed to create dist/cjs/package.json:', error.message);
  process.exit(1);
}
