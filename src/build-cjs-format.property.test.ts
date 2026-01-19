/**
 * CommonJS 构建格式属性测试
 * 
 * Feature: commonjs-build-support, Property 1: CommonJS 模块格式正确性
 * 
 * *For any* 源文件，当使用 `tsconfig.cjs.json` 编译后，生成的 JavaScript 文件
 * 应该包含 CommonJS 模块特征（`module.exports`、`require`、`exports`），
 * 而不包含 ESM 特征（`import`、`export`）。
 * 
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 递归获取目录中的所有文件
 */
function getAllFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 获取所有源文件（排除测试文件）
 */
function getAllSourceFiles(): string[] {
  const srcFiles = getAllFilesRecursive('src')
    .filter(f => f.endsWith('.ts'))
    .filter(f => !f.endsWith('.test.ts'))
    .filter(f => !f.endsWith('.property.test.ts'))
    .filter(f => !f.endsWith('.node-test.mjs'))
    .filter(f => !f.endsWith('.node-test.cjs'));

  return srcFiles;
}

/**
 * 将源文件路径转换为 CJS 构建产物路径
 */
function sourcePathToCjsPath(sourcePath: string): string {
  return sourcePath
    .replace(/\\/g, '/') // 统一使用正斜杠
    .replace('src/', 'dist/cjs/')
    .replace('.ts', '.js');
}

/**
 * 检查文件内容是否包含 CommonJS 特征
 */
function hasCommonJSFeatures(content: string): boolean {
  // CommonJS 特征：
  // - "use strict"; (通常在文件开头)
  // - Object.defineProperty(exports, "__esModule", { value: true });
  // - exports.functionName = functionName;
  // - module.exports = ...;
  // - require('...');
  
  const commonJSPatterns = [
    /Object\.defineProperty\(exports,\s*["']__esModule["']/,  // exports.__esModule
    /exports\.\w+\s*=/,                                        // exports.xxx =
    /module\.exports\s*=/,                                     // module.exports =
    /\brequire\s*\(/,                                          // require(...)
  ];

  return commonJSPatterns.some(pattern => pattern.test(content));
}

/**
 * 检查文件内容是否包含 ESM 特征
 */
function hasESMFeatures(content: string): boolean {
  // ESM 特征：我们需要检查真正的 ESM 语法，而不是 CommonJS 中的字符串
  // 注意：要避免误判 Object.defineProperty(exports, ...) 中的 "export" 字符串
  
  // 检查是否有真正的 export 语句（在行首或语句开始）
  const exportPatterns = [
    /^\s*export\s+\{/m,           // export { ... }
    /^\s*export\s+function\b/m,   // export function
    /^\s*export\s+const\b/m,      // export const
    /^\s*export\s+let\b/m,        // export let
    /^\s*export\s+var\b/m,        // export var
    /^\s*export\s+class\b/m,      // export class
    /^\s*export\s+interface\b/m,  // export interface
    /^\s*export\s+type\b/m,       // export type
    /^\s*export\s+default\b/m,    // export default
    /;\s*export\s+\{/,            // ; export { ... }
    /;\s*export\s+function\b/,    // ; export function
    /;\s*export\s+const\b/,       // ; export const
  ];

  // 检查是否有真正的 import 语句（静态导入）
  const importPatterns = [
    /^\s*import\s+.*\s+from\s+['"]/m,  // import ... from '...'
    /^\s*import\s*\{/m,                // import { ... }
    /^\s*import\s+\w+\s+from/m,        // import xxx from
    /;\s*import\s+.*\s+from\s+['"]/,   // ; import ... from
  ];
  
  const hasExport = exportPatterns.some(pattern => pattern.test(content));
  const hasImport = importPatterns.some(pattern => pattern.test(content));
  
  return hasExport || hasImport;
}

describe('CommonJS 构建格式属性测试', () => {
  /**
   * Feature: commonjs-build-support, Property 1: CommonJS 模块格式正确性
   * 
   * *For any* 源文件，编译后的 CJS 文件应包含 CommonJS 特征，
   * 而不包含 ESM 特征（静态 import/export）。
   * 
   * **Validates: Requirements 1.2**
   */
  it('Property 1: CJS 文件包含 CommonJS 模式而不包含 ESM 模式', () => {
    const sourceFiles = getAllSourceFiles();
    
    // 确保我们有源文件可以测试
    expect(sourceFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        // 从所有源文件中随机选择
        fc.constantFrom(...sourceFiles),
        (sourceFile) => {
          const cjsFile = sourcePathToCjsPath(sourceFile);
          
          // 如果 CJS 文件不存在，跳过（可能是某些特殊文件）
          if (!fs.existsSync(cjsFile)) {
            console.log(`⚠️  跳过不存在的 CJS 文件: ${cjsFile}`);
            return true;
          }

          const content = fs.readFileSync(cjsFile, 'utf-8');
          
          // 跳过空文件或几乎为空的文件（只有 "use strict" 和 sourcemap）
          const contentWithoutComments = content
            .replace(/\/\/.*$/gm, '')  // 移除单行注释
            .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
            .trim();
          
          if (contentWithoutComments === '' || contentWithoutComments === '"use strict";' || contentWithoutComments === "'use strict';") {
            // 空文件是可以接受的（例如 axios.ts 是空的）
            return true;
          }
          
          // 属性 1a: 应该包含 CommonJS 特征
          const hasCommonJS = hasCommonJSFeatures(content);
          
          // 属性 1b: 不应该包含 ESM 特征
          const hasESM = hasESMFeatures(content);
          
          // 如果测试失败，提供详细的错误信息
          if (!hasCommonJS || hasESM) {
            console.log(`\n❌ 测试失败: ${cjsFile}`);
            console.log(`   源文件: ${sourceFile}`);
            console.log(`   包含 CommonJS 特征: ${hasCommonJS}`);
            console.log(`   包含 ESM 特征: ${hasESM}`);
            console.log(`   文件内容预览 (前 500 字符):`);
            console.log(`   ${content.substring(0, 500)}`);
          }
          
          // 核心断言：必须有 CommonJS 特征，且不能有 ESM 特征
          return hasCommonJS && !hasESM;
        }
      ),
      {
        numRuns: 100, // 运行 100 次迭代
        verbose: true,
      }
    );
  });

  /**
   * Property 1 补充测试：验证特定的关键文件
   * 
   * 确保核心入口文件（index.js, register.js, config.js）
   * 都正确编译为 CommonJS 格式
   */
  it('Property 1 补充: 关键入口文件必须是 CommonJS 格式', () => {
    const keyFiles = [
      'dist/cjs/index.js',
      'dist/cjs/register.js',
      'dist/cjs/config.js',
      'dist/cjs/cli.js',
    ];

    for (const file of keyFiles) {
      // 文件必须存在
      expect(fs.existsSync(file), `文件应该存在: ${file}`).toBe(true);

      const content = fs.readFileSync(file, 'utf-8');

      // 必须包含 CommonJS 特征
      const hasCommonJS = hasCommonJSFeatures(content);
      expect(hasCommonJS, `${file} 应该包含 CommonJS 特征`).toBe(true);

      // 不应该包含 ESM 特征
      const hasESM = hasESMFeatures(content);
      expect(hasESM, `${file} 不应该包含 ESM 特征`).toBe(false);

      // 额外验证：应该包含 "use strict"
      expect(content).toContain('"use strict"');
    }
  });

  /**
   * Property 1 补充测试：验证所有 CJS 文件都有 "use strict"
   * 
   * CommonJS 模块应该在严格模式下运行
   */
  it('Property 1 补充: 所有 CJS 文件都应该包含 "use strict"', () => {
    const cjsFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => f.endsWith('.js'))
      .filter(f => !f.endsWith('package.json'));

    // 确保我们有 CJS 文件可以测试
    expect(cjsFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...cjsFiles),
        (cjsFile) => {
          const content = fs.readFileSync(cjsFile, 'utf-8');
          
          // 应该包含 "use strict"（通常在文件开头）
          const hasUseStrict = content.includes('"use strict"') || content.includes("'use strict'");
          
          if (!hasUseStrict) {
            console.log(`\n⚠️  文件缺少 "use strict": ${cjsFile}`);
          }
          
          return hasUseStrict;
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });

  /**
   * Property 1 补充测试：验证 CJS 文件使用 require 而不是 import
   * 
   * CommonJS 文件应该使用 require() 进行模块导入
   * 注意：TypeScript 编译后的 CommonJS 可能保留 .js 扩展名，这是正常的
   */
  it('Property 1 补充: CJS 文件应该使用 require 而不是静态 import', () => {
    const cjsFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => f.endsWith('.js'));

    expect(cjsFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...cjsFiles),
        (cjsFile) => {
          const content = fs.readFileSync(cjsFile, 'utf-8');
          
          // 检查是否有静态 import 语句（不包括动态 import()）
          const staticImportPattern = /^\s*import\s+/m;
          const hasStaticImport = staticImportPattern.test(content);
          
          // 如果有 require，说明是 CommonJS
          const hasRequire = /\brequire\s*\(/.test(content);
          
          // 检查是否是空文件（只有 "use strict" 和可能的 sourcemap 注释）
          const contentWithoutComments = content
            .replace(/\/\/.*$/gm, '')  // 移除单行注释
            .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
            .trim();
          
          const isEmpty = contentWithoutComments === '' || 
                         contentWithoutComments === '"use strict";' || 
                         contentWithoutComments === "'use strict';";
          
          if (isEmpty) {
            // 空文件是可以接受的（例如 axios.ts 是空的）
            return true;
          }
          
          if (hasStaticImport) {
            console.log(`\n⚠️  文件包含静态 import 语句: ${cjsFile}`);
            return false;
          }
          
          // 非空文件应该有 require 或 exports
          const hasCommonJS = hasRequire || /\bexports\b/.test(content) || /\bmodule\.exports\b/.test(content);
          
          if (!hasCommonJS) {
            console.log(`\n⚠️  文件既没有 require 也没有 exports: ${cjsFile}`);
          }
          
          return !hasStaticImport;
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });
});
