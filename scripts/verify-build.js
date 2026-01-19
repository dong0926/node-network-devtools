#!/usr/bin/env node
/**
 * 验证构建产物的完整性
 * 
 * 此脚本验证：
 * 1. dist/esm 目录存在且包含所有文件
 * 2. dist/cjs 目录存在且包含所有文件
 * 3. dist/types 目录存在且包含类型定义
 * 4. dist/cjs/package.json 存在且内容正确
 * 5. ESM 和 CJS 目录结构一致
 * 6. 所有 JS 文件都有对应的 source map
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let hasErrors = false;

function error(message) {
  console.error(`❌ ${message}`);
  hasErrors = true;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

// 递归获取目录中的所有文件
function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  
  return files;
}

console.log('🔍 开始验证构建产物...\n');

// 1. 验证目录存在
console.log('📁 验证目录结构...');
const requiredDirs = ['dist/esm', 'dist/cjs', 'dist/types', 'dist/gui'];

for (const dir of requiredDirs) {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    success(`目录存在: ${dir}`);
  } else {
    error(`目录不存在: ${dir}`);
  }
}

console.log();

// 2. 验证 dist/cjs/package.json
console.log('📦 验证 CommonJS 包标识...');
const cjsPackageJsonPath = path.join(rootDir, 'dist/cjs/package.json');

if (fs.existsSync(cjsPackageJsonPath)) {
  success('dist/cjs/package.json 存在');
  
  try {
    const content = JSON.parse(fs.readFileSync(cjsPackageJsonPath, 'utf-8'));
    if (content.type === 'commonjs') {
      success('dist/cjs/package.json 内容正确: {"type": "commonjs"}');
    } else {
      error(`dist/cjs/package.json 内容错误: ${JSON.stringify(content)}`);
    }
  } catch (err) {
    error(`无法解析 dist/cjs/package.json: ${err.message}`);
  }
} else {
  error('dist/cjs/package.json 不存在');
}

console.log();

// 3. 验证 ESM 和 CJS 目录结构一致
console.log('🔄 验证 ESM 和 CJS 目录结构一致性...');
const esmDir = path.join(rootDir, 'dist/esm');
const cjsDir = path.join(rootDir, 'dist/cjs');

if (fs.existsSync(esmDir) && fs.existsSync(cjsDir)) {
  const esmFiles = getAllFiles(esmDir)
    .filter(f => !f.endsWith('.map'))
    .sort();
  
  const cjsFiles = getAllFiles(cjsDir)
    .filter(f => !f.endsWith('.map') && f !== 'package.json')
    .sort();
  
  if (esmFiles.length === cjsFiles.length) {
    success(`ESM 和 CJS 文件数量一致: ${esmFiles.length} 个文件`);
    
    const mismatches = [];
    for (let i = 0; i < esmFiles.length; i++) {
      if (esmFiles[i] !== cjsFiles[i]) {
        mismatches.push({ esm: esmFiles[i], cjs: cjsFiles[i] });
      }
    }
    
    if (mismatches.length === 0) {
      success('ESM 和 CJS 文件名完全一致');
    } else {
      error(`发现 ${mismatches.length} 个文件名不匹配:`);
      mismatches.forEach(m => {
        console.error(`  ESM: ${m.esm}`);
        console.error(`  CJS: ${m.cjs}`);
      });
    }
  } else {
    error(`ESM 和 CJS 文件数量不一致: ESM=${esmFiles.length}, CJS=${cjsFiles.length}`);
    info('ESM 独有文件:');
    esmFiles.filter(f => !cjsFiles.includes(f)).forEach(f => console.log(`  - ${f}`));
    info('CJS 独有文件:');
    cjsFiles.filter(f => !esmFiles.includes(f)).forEach(f => console.log(`  - ${f}`));
  }
} else {
  error('无法比较 ESM 和 CJS 目录（目录不存在）');
}

console.log();

// 4. 验证 Source Maps
console.log('🗺️  验证 Source Maps...');
const checkSourceMaps = (dir, label) => {
  if (!fs.existsSync(dir)) {
    error(`${label} 目录不存在`);
    return;
  }
  
  const jsFiles = getAllFiles(dir).filter(f => f.endsWith('.js'));
  let missingMaps = 0;
  
  for (const jsFile of jsFiles) {
    const mapFile = jsFile + '.map';
    const fullMapPath = path.join(dir, mapFile);
    
    if (!fs.existsSync(fullMapPath)) {
      error(`缺少 source map: ${label}/${mapFile}`);
      missingMaps++;
    }
  }
  
  if (missingMaps === 0) {
    success(`${label}: 所有 ${jsFiles.length} 个 JS 文件都有 source map`);
  } else {
    error(`${label}: ${missingMaps}/${jsFiles.length} 个文件缺少 source map`);
  }
};

checkSourceMaps(esmDir, 'ESM');
checkSourceMaps(cjsDir, 'CJS');

console.log();

// 5. 验证类型定义
console.log('📘 验证类型定义...');
const typesDir = path.join(rootDir, 'dist/types');

if (fs.existsSync(typesDir)) {
  const dtsFiles = getAllFiles(typesDir).filter(f => f.endsWith('.d.ts'));
  const dtsMapFiles = getAllFiles(typesDir).filter(f => f.endsWith('.d.ts.map'));
  
  success(`类型定义文件: ${dtsFiles.length} 个`);
  success(`类型定义 source maps: ${dtsMapFiles.length} 个`);
  
  // 验证关键入口文件
  const keyFiles = ['index.d.ts', 'register.d.ts', 'cli.d.ts', 'config.d.ts'];
  for (const file of keyFiles) {
    const fullPath = path.join(typesDir, file);
    if (fs.existsSync(fullPath)) {
      success(`关键类型文件存在: ${file}`);
    } else {
      error(`关键类型文件缺失: ${file}`);
    }
  }
} else {
  error('dist/types 目录不存在');
}

console.log();

// 6. 验证 GUI 构建产物
console.log('🎨 验证 GUI 构建产物...');
const guiDir = path.join(rootDir, 'dist/gui');

if (fs.existsSync(guiDir)) {
  const indexHtml = path.join(guiDir, 'index.html');
  const assetsDir = path.join(guiDir, 'assets');
  
  if (fs.existsSync(indexHtml)) {
    success('GUI index.html 存在');
  } else {
    error('GUI index.html 不存在');
  }
  
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    success(`GUI assets 目录存在，包含 ${assets.length} 个文件`);
  } else {
    error('GUI assets 目录不存在');
  }
} else {
  error('dist/gui 目录不存在');
}

console.log();

// 总结
console.log('=' .repeat(50));
if (hasErrors) {
  console.error('❌ 验证失败！发现错误。');
  process.exit(1);
} else {
  console.log('✅ 所有验证通过！构建产物完整且正确。');
  process.exit(0);
}
