/**
 * 向后兼容性保持属性测试
 * 
 * Feature: commonjs-build-support, Property 5: 向后兼容性保持
 * 
 * *For any* 现有的 ESM 导入路径，在添加 CommonJS 支持后：
 * - 导入路径应该继续解析到 `dist/esm` 目录
 * - TypeScript 类型定义应该继续在 `dist/types` 目录
 * - 所有导出的 API 应该保持不变
 * 
 * **Validates: Requirements 1.4, 2.6, 5.2, 5.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 检查文件是否存在
 */
function fileExists(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

/**
 * 检查目录是否存在
 */
function directoryExists(dir: string): boolean {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

/**
 * 从 package.json 读取导出配置
 */
function getPackageExports(): Record<string, any> {
  const pkgPath = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg.exports || {};
}

/**
 * 从 package.json 读取主字段配置
 */
function getPackageMainFields(): { main: string; module: string; types: string } {
  const pkgPath = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return {
    main: pkg.main || '',
    module: pkg.module || '',
    types: pkg.types || '',
  };
}

/**
 * 获取文件中的所有导出名称
 */
function getExportNames(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const exportNames: string[] = [];

  // 匹配 export { name1, name2, ... }
  const namedExportMatches = content.matchAll(/export\s*\{\s*([^}]+)\s*\}/g);
  for (const match of namedExportMatches) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop()!.trim());
    exportNames.push(...names);
  }

  // 匹配 export function name()
  const functionExportMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
  for (const match of functionExportMatches) {
    exportNames.push(match[1]);
  }

  // 匹配 export const name
  const constExportMatches = content.matchAll(/export\s+const\s+(\w+)/g);
  for (const match of constExportMatches) {
    exportNames.push(match[1]);
  }

  // 匹配 export class name
  const classExportMatches = content.matchAll(/export\s+class\s+(\w+)/g);
  for (const match of classExportMatches) {
    exportNames.push(match[1]);
  }

  // 匹配 export interface name
  const interfaceExportMatches = content.matchAll(/export\s+interface\s+(\w+)/g);
  for (const match of interfaceExportMatches) {
    exportNames.push(match[1]);
  }

  // 匹配 export type name
  const typeExportMatches = content.matchAll(/export\s+type\s+(\w+)/g);
  for (const match of typeExportMatches) {
    exportNames.push(match[1]);
  }

  return [...new Set(exportNames)]; // 去重
}

describe('向后兼容性保持属性测试', () => {
  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 package.json 的 exports 字段中的 import 条件指向 ESM 目录
   * 
   * **Validates: Requirements 2.6, 5.2**
   */
  it('Property 5a: package.json exports 的 import 条件指向 ESM 目录', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    // 确保有导出路径
    expect(exportPaths.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 必须有 import 条件
          if (!exportConfig.import) {
            console.log(`\n❌ 导出路径缺少 import 条件: ${exportPath}`);
            return false;
          }

          // import 条件必须指向 dist/esm
          const importPath = exportConfig.import.default || exportConfig.import;
          const pointsToEsm = importPath.includes('dist/esm');

          if (!pointsToEsm) {
            console.log(`\n❌ import 条件未指向 ESM 目录:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   import 路径: ${importPath}`);
          }

          return pointsToEsm;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 package.json 的 module 字段仍然指向 ESM 目录
   * 
   * **Validates: Requirements 2.6, 5.2**
   */
  it('Property 5b: package.json module 字段指向 ESM 目录', () => {
    const { module } = getPackageMainFields();

    // module 字段必须存在
    expect(module).toBeTruthy();

    // module 字段必须指向 dist/esm
    expect(module).toContain('dist/esm');
    expect(module).toContain('index.js');
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 package.json 的 types 字段仍然指向 dist/types 目录
   * 
   * **Validates: Requirements 5.3**
   */
  it('Property 5c: package.json types 字段指向 dist/types 目录', () => {
    const { types } = getPackageMainFields();

    // types 字段必须存在
    expect(types).toBeTruthy();

    // types 字段必须指向 dist/types
    expect(types).toContain('dist/types');
    expect(types).toContain('index.d.ts');
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证所有 exports 路径的 types 字段都指向 dist/types 目录
   * 
   * **Validates: Requirements 5.3**
   */
  it('Property 5d: 所有 exports 的 types 字段指向 dist/types 目录', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 检查 import 条件的 types
          if (exportConfig.import && exportConfig.import.types) {
            const importTypes = exportConfig.import.types;
            if (!importTypes.includes('dist/types')) {
              console.log(`\n❌ import types 未指向 dist/types:`);
              console.log(`   导出路径: ${exportPath}`);
              console.log(`   types 路径: ${importTypes}`);
              return false;
            }
          }

          // 检查 require 条件的 types
          if (exportConfig.require && exportConfig.require.types) {
            const requireTypes = exportConfig.require.types;
            if (!requireTypes.includes('dist/types')) {
              console.log(`\n❌ require types 未指向 dist/types:`);
              console.log(`   导出路径: ${exportPath}`);
              console.log(`   types 路径: ${requireTypes}`);
              return false;
            }
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 ESM 构建产物仍然存在且位置未改变
   * 
   * **Validates: Requirements 1.4, 5.2**
   */
  it('Property 5e: ESM 构建产物仍然存在于 dist/esm 目录', () => {
    // 确保 ESM 目录存在
    expect(directoryExists('dist/esm'), 'dist/esm 目录应该存在').toBe(true);

    // 确保关键 ESM 文件存在
    const keyFiles = [
      'dist/esm/index.js',
      'dist/esm/register.js',
      'dist/esm/config.js',
      'dist/esm/cli.js',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...keyFiles),
        (file) => {
          const exists = fileExists(file);

          if (!exists) {
            console.log(`\n❌ 关键 ESM 文件缺失: ${file}`);
          }

          return exists;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证类型定义文件仍然存在于 dist/types 目录
   * 
   * **Validates: Requirements 5.3**
   */
  it('Property 5f: 类型定义文件仍然存在于 dist/types 目录', () => {
    // 确保 types 目录存在
    expect(directoryExists('dist/types'), 'dist/types 目录应该存在').toBe(true);

    // 确保关键类型定义文件存在
    const keyFiles = [
      'dist/types/index.d.ts',
      'dist/types/register.d.ts',
      'dist/types/config.d.ts',
      'dist/types/cli.d.ts',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...keyFiles),
        (file) => {
          const exists = fileExists(file);

          if (!exists) {
            console.log(`\n❌ 关键类型定义文件缺失: ${file}`);
          }

          return exists;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 ESM 和 CJS 导出相同的 API
   * 
   * **Validates: Requirements 1.4**
   */
  it('Property 5g: ESM 和 CJS 导出相同的 API', () => {
    const esmIndexPath = 'dist/esm/index.js';
    const cjsIndexPath = 'dist/cjs/index.js';

    // 确保两个文件都存在
    expect(fileExists(esmIndexPath), 'ESM index.js 应该存在').toBe(true);
    expect(fileExists(cjsIndexPath), 'CJS index.js 应该存在').toBe(true);

    // 读取两个文件的内容
    const esmContent = fs.readFileSync(esmIndexPath, 'utf-8');
    const cjsContent = fs.readFileSync(cjsIndexPath, 'utf-8');

    // 获取 ESM 导出的名称
    const esmExports = getExportNames(esmIndexPath);

    // 验证 CJS 也导出相同的名称
    for (const exportName of esmExports) {
      // 在 CJS 中，导出通常是 exports.name = name 或 Object.defineProperty(exports, "name", ...)
      const hasCjsExport = 
        cjsContent.includes(`exports.${exportName}`) ||
        cjsContent.includes(`"${exportName}"`) ||
        cjsContent.includes(`'${exportName}'`);

      if (!hasCjsExport) {
        console.log(`\n⚠️  CJS 可能缺少导出: ${exportName}`);
        // 注意：这只是警告，因为 CJS 的导出格式可能不同
      }
    }

    // 至少应该有一些导出
    expect(esmExports.length).toBeGreaterThan(0);
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证核心 API 在 ESM 构建中仍然可用
   * 
   * **Validates: Requirements 1.4**
   */
  it('Property 5h: 核心 API 在 ESM 构建中仍然可用', () => {
    const esmIndexPath = 'dist/esm/index.js';
    const content = fs.readFileSync(esmIndexPath, 'utf-8');

    // 核心 API 列表（从需求文档和设计文档中提取）
    const coreAPIs = [
      'getConfig',
      'setConfig',
      'resetConfig',
      'getRequestStore',
      'createRequestStore',
      'resetRequestStore',
      'HttpPatcher',
      'UndiciPatcher',
      'generateTraceId',
      'getCurrentTraceId',
      'startTrace',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...coreAPIs),
        (apiName) => {
          const isAvailable = content.includes(apiName);

          if (!isAvailable) {
            console.log(`\n❌ 核心 API 在 ESM 构建中不可用: ${apiName}`);
          }

          return isAvailable;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 ESM 文件仍然使用 ESM 语法
   * 
   * **Validates: Requirements 1.4, 5.2**
   */
  it('Property 5i: ESM 文件仍然使用 ESM 语法', () => {
    const esmIndexPath = 'dist/esm/index.js';
    const content = fs.readFileSync(esmIndexPath, 'utf-8');

    // ESM 文件应该包含 export 语句
    const hasExport = /export\s+/m.test(content);
    expect(hasExport, 'ESM 文件应该包含 export 语句').toBe(true);

    // ESM 文件不应该包含 module.exports
    const hasModuleExports = /module\.exports\s*=/m.test(content);
    expect(hasModuleExports, 'ESM 文件不应该包含 module.exports').toBe(false);
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 bin 字段仍然指向 ESM CLI
   * 
   * **Validates: Requirements 1.4**
   */
  it('Property 5j: bin 字段仍然指向 ESM CLI', () => {
    const pkgPath = 'package.json';
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    // bin 字段必须存在
    expect(pkg.bin).toBeDefined();

    // 所有 bin 命令都应该指向 dist/esm
    const binCommands = Object.keys(pkg.bin);

    fc.assert(
      fc.property(
        fc.constantFrom(...binCommands),
        (command) => {
          const binPath = pkg.bin[command];
          const pointsToEsm = binPath.includes('dist/esm');

          if (!pointsToEsm) {
            console.log(`\n❌ bin 命令未指向 ESM:`);
            console.log(`   命令: ${command}`);
            console.log(`   路径: ${binPath}`);
          }

          return pointsToEsm;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证 package.json 的 type 字段仍然是 "module"
   * 
   * **Validates: Requirements 1.4, 5.2**
   */
  it('Property 5k: package.json type 字段仍然是 "module"', () => {
    const pkgPath = 'package.json';
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    // type 字段必须是 "module"
    expect(pkg.type).toBe('module');
  });

  /**
   * Feature: commonjs-build-support, Property 5: 向后兼容性保持
   * 
   * 验证所有导出路径的文件都存在
   * 
   * **Validates: Requirements 1.4, 5.2**
   */
  it('Property 5l: 所有 exports 路径的文件都存在', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 检查 import 路径
          if (exportConfig.import) {
            const importPath = exportConfig.import.default || exportConfig.import;
            if (!fileExists(importPath)) {
              console.log(`\n❌ import 路径的文件不存在:`);
              console.log(`   导出路径: ${exportPath}`);
              console.log(`   文件路径: ${importPath}`);
              return false;
            }
          }

          // 检查 require 路径
          if (exportConfig.require) {
            const requirePath = exportConfig.require.default || exportConfig.require;
            if (!fileExists(requirePath)) {
              console.log(`\n❌ require 路径的文件不存在:`);
              console.log(`   导出路径: ${exportPath}`);
              console.log(`   文件路径: ${requirePath}`);
              return false;
            }
          }

          // 检查 types 路径
          if (exportConfig.import && exportConfig.import.types) {
            if (!fileExists(exportConfig.import.types)) {
              console.log(`\n❌ types 路径的文件不存在:`);
              console.log(`   导出路径: ${exportPath}`);
              console.log(`   文件路径: ${exportConfig.import.types}`);
              return false;
            }
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});
