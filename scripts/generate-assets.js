import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const guiDistDir = join(rootDir, 'dist/gui');
const outputFile = join(rootDir, 'src/gui/assets.gen.ts');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function getFiles(dir) {
  const results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const path = join(dir, file);
    const stat = statSync(path);
    if (stat && stat.isDirectory()) {
      results.push(...getFiles(path));
    } else {
      results.push(path);
    }
  }
  return results;
}

try {
  const files = getFiles(guiDistDir);
  const assets = {};

  for (const file of files) {
    const relativePath = '/' + relative(guiDistDir, file).split(sep).join('/');
    const content = readFileSync(file);
    const ext = '.' + file.split('.').pop();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    assets[relativePath] = {
      content: content.toString('base64'),
      contentType,
    };
  }

  const tsContent = `/**
 * 该文件由 scripts/generate-assets.js 自动生成
 * 请勿手动修改
 */

export const assets: Record<string, { content: string; contentType: string }> = ${JSON.stringify(assets, null, 2)}`;

  writeFileSync(outputFile, tsContent);
  console.log(`[Generate Assets] 成功生成 ${Object.keys(assets).length} 个资产到 ${outputFile}`);
} catch (error) {
  console.error('[Generate Assets] 失败:', error.message);
  // 如果 dist/gui 不存在，生成一个空的资产文件以免编译失败
  writeFileSync(outputFile, 'export const assets: Record<string, { content: string; contentType: string }> = {};\n');
}
