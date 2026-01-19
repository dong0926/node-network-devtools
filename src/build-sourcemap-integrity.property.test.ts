/**
 * Source Map 完整性属性测试
 * 
 * Feature: commonjs-build-support, Property 4: Source Map 完整性
 * 
 * *For any* 在 `dist/cjs` 或 `dist/esm` 中的 `.js` 文件，
 * 应该存在对应的 `.js.map` source map 文件。
 * 
 * **Validates: Requirements 1.3**
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
 * 验证 source map 文件的内容是否有效
 */
function isValidSourceMap(mapFile: string): boolean {
  try {
    const content = fs.readFileSync(mapFile, 'utf-8');
    const sourceMap = JSON.parse(content);
    
    // Source map 必须包含这些字段
    return (
      typeof sourceMap.version === 'number' &&
      typeof sourceMap.file === 'string' &&
      Array.isArray(sourceMap.sources) &&
      typeof sourceMap.mappings === 'string'
    );
  } catch (error) {
    return false;
  }
}

/**
 * 检查 JS 文件是否引用了 source map
 */
function hasSourceMapReference(jsFile: string): boolean {
  try {
    const content = fs.readFileSync(jsFile, 'utf-8');
    // 检查是否有 sourceMappingURL 注释
    return /\/\/# sourceMappingURL=/.test(content);
  } catch (error) {
    return false;
  }
}

describe('Source Map 完整性属性测试', () => {
  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * *For any* ESM 目录中的 .js 文件，应该存在对应的 .js.map 文件
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4a: ESM 目录中的每个 .js 文件都有对应的 .js.map', () => {
    // 确保 ESM 目录存在
    expect(directoryExists('dist/esm'), 'dist/esm 应该存在').toBe(true);

    // 获取所有 ESM .js 文件
    const esmJsFiles = getAllFilesRecursive('dist/esm')
      .filter(f => f.endsWith('.js'));

    // 确保我们有 JS 文件可以测试
    expect(esmJsFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...esmJsFiles),
        (jsFile) => {
          const mapFile = jsFile + '.map';
          const exists = fileExists(mapFile);

          if (!exists) {
            console.log(`\n❌ Source map 文件缺失:`);
            console.log(`   JS 文件: ${jsFile}`);
            console.log(`   期望的 map 文件: ${mapFile}`);
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
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * *For any* CJS 目录中的 .js 文件，应该存在对应的 .js.map 文件
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4b: CJS 目录中的每个 .js 文件都有对应的 .js.map', () => {
    // 确保 CJS 目录存在
    expect(directoryExists('dist/cjs'), 'dist/cjs 应该存在').toBe(true);

    // 获取所有 CJS .js 文件（排除 package.json）
    const cjsJsFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => f.endsWith('.js'))
      .filter(f => !f.endsWith('package.json'));

    // 确保我们有 JS 文件可以测试
    expect(cjsJsFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...cjsJsFiles),
        (jsFile) => {
          const mapFile = jsFile + '.map';
          const exists = fileExists(mapFile);

          if (!exists) {
            console.log(`\n❌ Source map 文件缺失:`);
            console.log(`   JS 文件: ${jsFile}`);
            console.log(`   期望的 map 文件: ${mapFile}`);
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
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * *For any* 构建目录（ESM 或 CJS）中的 .js 文件，
   * 应该存在对应的 .js.map 文件
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4c: 所有构建目录中的 .js 文件都有对应的 .js.map', () => {
    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          // 确保目录存在
          if (!directoryExists(buildDir)) {
            console.log(`\n⚠️  构建目录不存在: ${buildDir}`);
            return false;
          }

          // 获取所有 .js 文件
          const jsFiles = getAllFilesRecursive(buildDir)
            .filter(f => f.endsWith('.js'))
            .filter(f => !f.endsWith('package.json'));

          // 检查每个 JS 文件是否有对应的 map 文件
          const missingMaps: string[] = [];
          for (const jsFile of jsFiles) {
            const mapFile = jsFile + '.map';
            if (!fileExists(mapFile)) {
              missingMaps.push(jsFile);
            }
          }

          if (missingMaps.length > 0) {
            console.log(`\n❌ ${buildDir} 中有 ${missingMaps.length} 个文件缺少 source map:`);
            console.log(`   缺失的文件: ${missingMaps.slice(0, 5).join(', ')}`);
            if (missingMaps.length > 5) {
              console.log(`   ... 还有 ${missingMaps.length - 5} 个文件`);
            }
          }

          return missingMaps.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * *For any* source map 文件，其内容应该是有效的 JSON 并包含必需字段
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4d: 所有 source map 文件都是有效的', () => {
    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          // 获取所有 .js.map 文件
          const mapFiles = getAllFilesRecursive(buildDir)
            .filter(f => f.endsWith('.js.map'));

          if (mapFiles.length === 0) {
            console.log(`\n⚠️  ${buildDir} 中没有 source map 文件`);
            return false;
          }

          // 检查每个 map 文件是否有效
          const invalidMaps: string[] = [];
          for (const mapFile of mapFiles) {
            if (!isValidSourceMap(mapFile)) {
              invalidMaps.push(mapFile);
            }
          }

          if (invalidMaps.length > 0) {
            console.log(`\n❌ ${buildDir} 中有 ${invalidMaps.length} 个无效的 source map:`);
            console.log(`   无效的文件: ${invalidMaps.slice(0, 5).join(', ')}`);
          }

          return invalidMaps.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * *For any* .js 文件，应该包含 sourceMappingURL 注释
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4e: 所有 .js 文件都包含 sourceMappingURL 注释', () => {
    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          // 获取所有 .js 文件
          const jsFiles = getAllFilesRecursive(buildDir)
            .filter(f => f.endsWith('.js'))
            .filter(f => !f.endsWith('package.json'));

          if (jsFiles.length === 0) {
            console.log(`\n⚠️  ${buildDir} 中没有 JS 文件`);
            return false;
          }

          // 检查每个 JS 文件是否有 sourceMappingURL
          const missingReferences: string[] = [];
          for (const jsFile of jsFiles) {
            if (!hasSourceMapReference(jsFile)) {
              missingReferences.push(jsFile);
            }
          }

          if (missingReferences.length > 0) {
            console.log(`\n❌ ${buildDir} 中有 ${missingReferences.length} 个文件缺少 sourceMappingURL:`);
            console.log(`   缺失的文件: ${missingReferences.slice(0, 5).join(', ')}`);
          }

          return missingReferences.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * 验证关键入口文件的 source map 存在
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4f: 关键入口文件的 source map 必须存在', () => {
    const keyFiles = [
      'index.js',
      'register.js',
      'config.js',
      'cli.js',
    ];

    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...keyFiles),
        fc.constantFrom(...buildDirs),
        (fileName, buildDir) => {
          const jsFile = path.join(buildDir, fileName);
          const mapFile = jsFile + '.map';

          // JS 文件必须存在
          if (!fileExists(jsFile)) {
            console.log(`\n⚠️  关键 JS 文件不存在: ${jsFile}`);
            return false;
          }

          // Source map 必须存在
          const mapExists = fileExists(mapFile);
          if (!mapExists) {
            console.log(`\n❌ 关键文件的 source map 缺失:`);
            console.log(`   JS 文件: ${jsFile}`);
            console.log(`   期望的 map 文件: ${mapFile}`);
          }

          return mapExists;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * 验证 source map 文件指向正确的源文件
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4g: Source map 文件指向正确的源文件', () => {
    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          // 获取所有 .js.map 文件
          const mapFiles = getAllFilesRecursive(buildDir)
            .filter(f => f.endsWith('.js.map'));

          if (mapFiles.length === 0) {
            return true;
          }

          // 检查每个 map 文件的 sources 字段
          const invalidSources: string[] = [];
          for (const mapFile of mapFiles) {
            try {
              const content = fs.readFileSync(mapFile, 'utf-8');
              const sourceMap = JSON.parse(content);

              // sources 应该是数组且不为空
              if (!Array.isArray(sourceMap.sources) || sourceMap.sources.length === 0) {
                invalidSources.push(mapFile);
                continue;
              }

              // sources 应该指向 TypeScript 源文件
              const hasValidSources = sourceMap.sources.some((source: string) => 
                source.endsWith('.ts')
              );

              if (!hasValidSources) {
                invalidSources.push(mapFile);
              }
            } catch (error) {
              invalidSources.push(mapFile);
            }
          }

          if (invalidSources.length > 0) {
            console.log(`\n❌ ${buildDir} 中有 ${invalidSources.length} 个 source map 的 sources 字段无效:`);
            console.log(`   无效的文件: ${invalidSources.slice(0, 3).join(', ')}`);
          }

          return invalidSources.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * 验证 ESM 和 CJS 的 source map 数量相同
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4h: ESM 和 CJS 的 source map 数量相同', () => {
    const esmMapFiles = getAllFilesRecursive('dist/esm')
      .filter(f => f.endsWith('.js.map'));
    const cjsMapFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => f.endsWith('.js.map'));

    const esmCount = esmMapFiles.length;
    const cjsCount = cjsMapFiles.length;

    if (esmCount !== cjsCount) {
      console.log('\n❌ Source map 数量不一致:');
      console.log(`   ESM source maps: ${esmCount}`);
      console.log(`   CJS source maps: ${cjsCount}`);
      console.log(`   差异: ${Math.abs(esmCount - cjsCount)}`);
    }

    expect(esmCount).toBe(cjsCount);
  });

  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * 验证 source map 文件不为空
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4i: 所有 source map 文件都不为空', () => {
    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          // 获取所有 .js.map 文件
          const mapFiles = getAllFilesRecursive(buildDir)
            .filter(f => f.endsWith('.js.map'));

          // 检查每个 map 文件是否为空
          const emptyMaps: string[] = [];
          for (const mapFile of mapFiles) {
            const stat = fs.statSync(mapFile);
            if (stat.size === 0) {
              emptyMaps.push(mapFile);
            }
          }

          if (emptyMaps.length > 0) {
            console.log(`\n❌ ${buildDir} 中有 ${emptyMaps.length} 个空的 source map 文件:`);
            console.log(`   空文件: ${emptyMaps.join(', ')}`);
          }

          return emptyMaps.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 4: Source Map 完整性
   * 
   * 验证 source map 的 file 字段与实际 JS 文件名匹配
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 4j: Source map 的 file 字段与 JS 文件名匹配', () => {
    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          // 获取所有 .js.map 文件
          const mapFiles = getAllFilesRecursive(buildDir)
            .filter(f => f.endsWith('.js.map'));

          // 检查每个 map 文件的 file 字段
          const mismatchedFiles: string[] = [];
          for (const mapFile of mapFiles) {
            try {
              const content = fs.readFileSync(mapFile, 'utf-8');
              const sourceMap = JSON.parse(content);

              // 获取对应的 JS 文件名
              const expectedFileName = path.basename(mapFile).replace('.map', '');
              const actualFileName = sourceMap.file;

              if (actualFileName !== expectedFileName) {
                mismatchedFiles.push(mapFile);
                console.log(`\n⚠️  Source map file 字段不匹配:`);
                console.log(`   Map 文件: ${mapFile}`);
                console.log(`   期望: ${expectedFileName}`);
                console.log(`   实际: ${actualFileName}`);
              }
            } catch (error) {
              // 已经在其他测试中检查过有效性
            }
          }

          return mismatchedFiles.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});
