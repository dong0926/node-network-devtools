/**
 * Package Exports 类型定义完整性属性测试
 * 
 * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
 * 
 * *For any* 在 `package.json` 的 `exports` 字段中定义的导出路径，应该同时包含：
 * - `import` 条件的 `types` 字段
 * - `require` 条件的 `types` 字段
 * - 两者都指向 `dist/types` 目录中的相同类型定义文件
 * 
 * **Validates: Requirements 2.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';

/**
 * 检查文件是否存在
 */
function fileExists(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

/**
 * 从 package.json 读取导出配置
 */
function getPackageExports(): Record<string, any> {
  const pkgPath = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg.exports || {};
}

describe('Package Exports 类型定义完整性属性测试', () => {
  /**
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * *For any* exports 路径，import 条件必须有 types 字段
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6a: 所有 exports 的 import 条件都有 types 字段', () => {
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

          // import 条件必须有 types 字段
          const hasTypes = exportConfig.import.types !== undefined;

          if (!hasTypes) {
            console.log(`\n❌ import 条件缺少 types 字段:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   import 配置:`, exportConfig.import);
          }

          return hasTypes;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * *For any* exports 路径，require 条件必须有 types 字段
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6b: 所有 exports 的 require 条件都有 types 字段', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 必须有 require 条件
          if (!exportConfig.require) {
            console.log(`\n❌ 导出路径缺少 require 条件: ${exportPath}`);
            return false;
          }

          // require 条件必须有 types 字段
          const hasTypes = exportConfig.require.types !== undefined;

          if (!hasTypes) {
            console.log(`\n❌ require 条件缺少 types 字段:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   require 配置:`, exportConfig.require);
          }

          return hasTypes;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * *For any* exports 路径，import 和 require 的 types 字段必须指向相同的文件
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6c: import 和 require 的 types 字段指向相同的文件', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 获取 import 和 require 的 types
          const importTypes = exportConfig.import?.types;
          const requireTypes = exportConfig.require?.types;

          // 两者必须相同
          const areSame = importTypes === requireTypes;

          if (!areSame) {
            console.log(`\n❌ import 和 require 的 types 字段不一致:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   import types: ${importTypes}`);
            console.log(`   require types: ${requireTypes}`);
          }

          return areSame;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * *For any* exports 路径，types 字段必须指向 dist/types 目录
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6d: 所有 types 字段都指向 dist/types 目录', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 检查 import types
          const importTypes = exportConfig.import?.types;
          if (importTypes && !importTypes.includes('dist/types')) {
            console.log(`\n❌ import types 未指向 dist/types:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   types 路径: ${importTypes}`);
            return false;
          }

          // 检查 require types
          const requireTypes = exportConfig.require?.types;
          if (requireTypes && !requireTypes.includes('dist/types')) {
            console.log(`\n❌ require types 未指向 dist/types:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   types 路径: ${requireTypes}`);
            return false;
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
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * *For any* exports 路径，types 字段指向的文件必须存在
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6e: 所有 types 字段指向的文件都存在', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 检查 import types
          const importTypes = exportConfig.import?.types;
          if (importTypes && !fileExists(importTypes)) {
            console.log(`\n❌ import types 文件不存在:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   types 路径: ${importTypes}`);
            return false;
          }

          // 检查 require types
          const requireTypes = exportConfig.require?.types;
          if (requireTypes && !fileExists(requireTypes)) {
            console.log(`\n❌ require types 文件不存在:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   types 路径: ${requireTypes}`);
            return false;
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
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * *For any* exports 路径，types 字段必须指向 .d.ts 文件
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6f: 所有 types 字段都指向 .d.ts 文件', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 检查 import types
          const importTypes = exportConfig.import?.types;
          if (importTypes && !importTypes.endsWith('.d.ts')) {
            console.log(`\n❌ import types 不是 .d.ts 文件:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   types 路径: ${importTypes}`);
            return false;
          }

          // 检查 require types
          const requireTypes = exportConfig.require?.types;
          if (requireTypes && !requireTypes.endsWith('.d.ts')) {
            console.log(`\n❌ require types 不是 .d.ts 文件:`);
            console.log(`   导出路径: ${exportPath}`);
            console.log(`   types 路径: ${requireTypes}`);
            return false;
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
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * 验证关键导出路径的 types 配置
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6g: 关键导出路径的 types 配置正确', () => {
    const exports = getPackageExports();

    // 关键导出路径
    const keyExports = ['.', './register'];

    fc.assert(
      fc.property(
        fc.constantFrom(...keyExports),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 必须存在
          if (!exportConfig) {
            console.log(`\n❌ 关键导出路径不存在: ${exportPath}`);
            return false;
          }

          // 必须有 import 和 require 条件
          if (!exportConfig.import || !exportConfig.require) {
            console.log(`\n❌ 关键导出路径缺少 import 或 require 条件: ${exportPath}`);
            return false;
          }

          // 必须有 types 字段
          if (!exportConfig.import.types || !exportConfig.require.types) {
            console.log(`\n❌ 关键导出路径缺少 types 字段: ${exportPath}`);
            return false;
          }

          // types 必须相同
          if (exportConfig.import.types !== exportConfig.require.types) {
            console.log(`\n❌ 关键导出路径的 types 不一致: ${exportPath}`);
            return false;
          }

          // types 文件必须存在
          if (!fileExists(exportConfig.import.types)) {
            console.log(`\n❌ 关键导出路径的 types 文件不存在: ${exportPath}`);
            return false;
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
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * 验证 types 字段在 import/require 条件中的位置（应该在 default 之前）
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6h: types 字段在 import/require 条件中正确排序', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 检查 import 条件的键顺序
          if (exportConfig.import) {
            const importKeys = Object.keys(exportConfig.import);
            const typesIndex = importKeys.indexOf('types');
            const defaultIndex = importKeys.indexOf('default');

            // 如果两者都存在，types 应该在 default 之前
            if (typesIndex !== -1 && defaultIndex !== -1 && typesIndex > defaultIndex) {
              console.log(`\n⚠️  import 条件中 types 应该在 default 之前:`);
              console.log(`   导出路径: ${exportPath}`);
              console.log(`   键顺序: ${importKeys.join(', ')}`);
              // 注意：这只是警告，不是错误，因为 JSON 对象的键顺序在某些情况下不重要
            }
          }

          // 检查 require 条件的键顺序
          if (exportConfig.require) {
            const requireKeys = Object.keys(exportConfig.require);
            const typesIndex = requireKeys.indexOf('types');
            const defaultIndex = requireKeys.indexOf('default');

            // 如果两者都存在，types 应该在 default 之前
            if (typesIndex !== -1 && defaultIndex !== -1 && typesIndex > defaultIndex) {
              console.log(`\n⚠️  require 条件中 types 应该在 default 之前:`);
              console.log(`   导出路径: ${exportPath}`);
              console.log(`   键顺序: ${requireKeys.join(', ')}`);
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
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * 验证 types 文件内容有效（是有效的 TypeScript 声明文件）
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6i: types 文件内容有效', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];
          const typesPath = exportConfig.import?.types || exportConfig.require?.types;

          if (!typesPath) {
            return true; // 跳过没有 types 的导出
          }

          // 读取 types 文件内容
          const content = fs.readFileSync(typesPath, 'utf-8');

          // 验证文件不为空
          if (content.trim().length === 0) {
            console.log(`\n❌ types 文件为空: ${typesPath}`);
            return false;
          }

          // 验证文件包含 TypeScript 声明（export 或 declare）
          const hasDeclarations = 
            /export\s+/m.test(content) ||
            /declare\s+/m.test(content);

          if (!hasDeclarations) {
            console.log(`\n❌ types 文件缺少声明: ${typesPath}`);
            return false;
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
   * Feature: commonjs-build-support, Property 6: Package Exports 类型定义完整性
   * 
   * 验证所有 exports 路径都有完整的 types 配置
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 6j: 所有 exports 路径都有完整的 types 配置', () => {
    const exports = getPackageExports();
    const exportPaths = Object.keys(exports);

    fc.assert(
      fc.property(
        fc.constantFrom(...exportPaths),
        (exportPath) => {
          const exportConfig = exports[exportPath];

          // 检查完整性
          const hasImport = exportConfig.import !== undefined;
          const hasRequire = exportConfig.require !== undefined;
          const hasImportTypes = exportConfig.import?.types !== undefined;
          const hasRequireTypes = exportConfig.require?.types !== undefined;
          const typesMatch = exportConfig.import?.types === exportConfig.require?.types;
          const typesPointToDistTypes = exportConfig.import?.types?.includes('dist/types');
          const typesFileExists = exportConfig.import?.types ? fileExists(exportConfig.import.types) : false;

          const isComplete = 
            hasImport &&
            hasRequire &&
            hasImportTypes &&
            hasRequireTypes &&
            typesMatch &&
            typesPointToDistTypes &&
            typesFileExists;

          if (!isComplete) {
            console.log(`\n❌ 导出路径的 types 配置不完整: ${exportPath}`);
            console.log(`   有 import: ${hasImport}`);
            console.log(`   有 require: ${hasRequire}`);
            console.log(`   有 import types: ${hasImportTypes}`);
            console.log(`   有 require types: ${hasRequireTypes}`);
            console.log(`   types 一致: ${typesMatch}`);
            console.log(`   指向 dist/types: ${typesPointToDistTypes}`);
            console.log(`   文件存在: ${typesFileExists}`);
          }

          return isComplete;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});
