/**
 * 目录结构一致性属性测试
 * 
 * Feature: commonjs-build-support, Property 3: 目录结构一致性
 * 
 * *For any* 成功的构建，`dist/esm` 和 `dist/cjs` 目录应该具有相同的
 * 子目录结构和文件名（扩展名为 `.js`），只是模块格式不同。
 * 
 * **Validates: Requirements 1.5**
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
 * 递归获取目录中的所有子目录
 */
function getAllDirectoriesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const directories: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      directories.push(fullPath);
      directories.push(...getAllDirectoriesRecursive(fullPath));
    }
  }

  return directories;
}

/**
 * 将路径标准化为相对路径（移除基础目录前缀）
 */
function normalizePathRelativeTo(filePath: string, baseDir: string): string {
  return filePath
    .replace(/\\/g, '/') // 统一使用正斜杠
    .replace(baseDir + '/', ''); // 移除基础目录前缀
}

/**
 * 获取目录的相对路径列表
 */
function getRelativeFilePaths(dir: string): string[] {
  const files = getAllFilesRecursive(dir);
  return files
    .map(f => normalizePathRelativeTo(f, dir))
    .sort();
}

/**
 * 获取子目录的相对路径列表
 */
function getRelativeDirectoryPaths(dir: string): string[] {
  const directories = getAllDirectoriesRecursive(dir);
  return directories
    .map(d => normalizePathRelativeTo(d, dir))
    .sort();
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

describe('目录结构一致性属性测试', () => {
  /**
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * 验证 dist/esm 和 dist/cjs 具有相同的子目录结构
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3a: ESM 和 CJS 具有相同的子目录结构', () => {
    // 确保两个目录都存在
    expect(directoryExists('dist/esm'), 'dist/esm 应该存在').toBe(true);
    expect(directoryExists('dist/cjs'), 'dist/cjs 应该存在').toBe(true);

    // 获取两个目录的子目录列表
    const esmDirs = getRelativeDirectoryPaths('dist/esm');
    const cjsDirs = getRelativeDirectoryPaths('dist/cjs');

    // 两个目录应该有相同的子目录结构
    if (esmDirs.length !== cjsDirs.length || !esmDirs.every((dir, i) => dir === cjsDirs[i])) {
      console.log('\n❌ 子目录结构不一致:');
      console.log(`   ESM 子目录 (${esmDirs.length}):`, esmDirs);
      console.log(`   CJS 子目录 (${cjsDirs.length}):`, cjsDirs);
      
      // 找出差异
      const onlyInEsm = esmDirs.filter(d => !cjsDirs.includes(d));
      const onlyInCjs = cjsDirs.filter(d => !esmDirs.includes(d));
      
      if (onlyInEsm.length > 0) {
        console.log(`   只在 ESM 中: ${onlyInEsm.join(', ')}`);
      }
      if (onlyInCjs.length > 0) {
        console.log(`   只在 CJS 中: ${onlyInCjs.join(', ')}`);
      }
    }

    expect(esmDirs).toEqual(cjsDirs);
  });

  /**
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * 验证 dist/esm 和 dist/cjs 具有相同的文件列表（排除 package.json）
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3b: ESM 和 CJS 具有相同的文件列表', () => {
    // 确保两个目录都存在
    expect(directoryExists('dist/esm'), 'dist/esm 应该存在').toBe(true);
    expect(directoryExists('dist/cjs'), 'dist/cjs 应该存在').toBe(true);

    // 获取两个目录的文件列表
    let esmFiles = getRelativeFilePaths('dist/esm');
    let cjsFiles = getRelativeFilePaths('dist/cjs');

    // 从 CJS 文件列表中移除 package.json（这是 CJS 特有的）
    cjsFiles = cjsFiles.filter(f => !f.endsWith('package.json'));

    // 两个目录应该有相同的文件列表
    if (esmFiles.length !== cjsFiles.length || !esmFiles.every((file, i) => file === cjsFiles[i])) {
      console.log('\n❌ 文件列表不一致:');
      console.log(`   ESM 文件数: ${esmFiles.length}`);
      console.log(`   CJS 文件数: ${cjsFiles.length}`);
      
      // 找出差异
      const onlyInEsm = esmFiles.filter(f => !cjsFiles.includes(f));
      const onlyInCjs = cjsFiles.filter(f => !esmFiles.includes(f));
      
      if (onlyInEsm.length > 0) {
        console.log(`   只在 ESM 中 (${onlyInEsm.length}):`, onlyInEsm.slice(0, 10));
      }
      if (onlyInCjs.length > 0) {
        console.log(`   只在 CJS 中 (${onlyInCjs.length}):`, onlyInCjs.slice(0, 10));
      }
    }

    expect(esmFiles).toEqual(cjsFiles);
  });

  /**
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * *For any* ESM 文件，对应的 CJS 文件应该存在
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3c: 对于任何 ESM 文件，对应的 CJS 文件应该存在', () => {
    const esmFiles = getAllFilesRecursive('dist/esm')
      .filter(f => f.endsWith('.js') || f.endsWith('.js.map'));

    // 确保我们有 ESM 文件可以测试
    expect(esmFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...esmFiles),
        (esmFile) => {
          // 将 ESM 路径转换为 CJS 路径
          const cjsFile = esmFile.replace(/\\/g, '/').replace('dist/esm/', 'dist/cjs/');
          const exists = fileExists(cjsFile);

          if (!exists) {
            console.log(`\n❌ 对应的 CJS 文件不存在:`);
            console.log(`   ESM 文件: ${esmFile}`);
            console.log(`   期望的 CJS 文件: ${cjsFile}`);
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
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * *For any* CJS 文件（排除 package.json），对应的 ESM 文件应该存在
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3d: 对于任何 CJS 文件，对应的 ESM 文件应该存在', () => {
    const cjsFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => f.endsWith('.js') || f.endsWith('.js.map'))
      .filter(f => !f.endsWith('package.json')); // 排除 package.json

    // 确保我们有 CJS 文件可以测试
    expect(cjsFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...cjsFiles),
        (cjsFile) => {
          // 将 CJS 路径转换为 ESM 路径
          const esmFile = cjsFile.replace(/\\/g, '/').replace('dist/cjs/', 'dist/esm/');
          const exists = fileExists(esmFile);

          if (!exists) {
            console.log(`\n❌ 对应的 ESM 文件不存在:`);
            console.log(`   CJS 文件: ${cjsFile}`);
            console.log(`   期望的 ESM 文件: ${esmFile}`);
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
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * *For any* ESM 子目录，对应的 CJS 子目录应该存在
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3e: 对于任何 ESM 子目录，对应的 CJS 子目录应该存在', () => {
    const esmDirs = getAllDirectoriesRecursive('dist/esm');

    // 确保我们有 ESM 子目录可以测试
    expect(esmDirs.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...esmDirs),
        (esmDir) => {
          // 将 ESM 路径转换为 CJS 路径
          const cjsDir = esmDir.replace(/\\/g, '/').replace('dist/esm/', 'dist/cjs/');
          const exists = directoryExists(cjsDir);

          if (!exists) {
            console.log(`\n❌ 对应的 CJS 子目录不存在:`);
            console.log(`   ESM 子目录: ${esmDir}`);
            console.log(`   期望的 CJS 子目录: ${cjsDir}`);
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
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * *For any* CJS 子目录，对应的 ESM 子目录应该存在
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3f: 对于任何 CJS 子目录，对应的 ESM 子目录应该存在', () => {
    const cjsDirs = getAllDirectoriesRecursive('dist/cjs');

    // 确保我们有 CJS 子目录可以测试
    expect(cjsDirs.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...cjsDirs),
        (cjsDir) => {
          // 将 CJS 路径转换为 ESM 路径
          const esmDir = cjsDir.replace(/\\/g, '/').replace('dist/cjs/', 'dist/esm/');
          const exists = directoryExists(esmDir);

          if (!exists) {
            console.log(`\n❌ 对应的 ESM 子目录不存在:`);
            console.log(`   CJS 子目录: ${cjsDir}`);
            console.log(`   期望的 ESM 子目录: ${esmDir}`);
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
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * 验证关键模块目录在 ESM 和 CJS 中都存在
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3g: 关键模块目录在 ESM 和 CJS 中都存在', () => {
    // 只检查实际存在的模块目录（排除空目录）
    const keyModules = [
      'adapters',
      'context',
      'gui',
      'interceptors',
      'store',
      'utils',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...keyModules),
        (moduleName) => {
          const esmDir = `dist/esm/${moduleName}`;
          const cjsDir = `dist/cjs/${moduleName}`;

          const esmExists = directoryExists(esmDir);
          const cjsExists = directoryExists(cjsDir);

          if (!esmExists || !cjsExists) {
            console.log(`\n❌ 关键模块目录缺失:`);
            console.log(`   模块: ${moduleName}`);
            console.log(`   ESM 存在: ${esmExists}`);
            console.log(`   CJS 存在: ${cjsExists}`);
          }

          return esmExists && cjsExists;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * 验证 ESM 和 CJS 中的文件数量相同（排除 package.json）
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3h: ESM 和 CJS 中的文件数量相同', () => {
    const esmFiles = getAllFilesRecursive('dist/esm');
    const cjsFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => !f.endsWith('package.json')); // 排除 CJS 特有的 package.json

    const esmCount = esmFiles.length;
    const cjsCount = cjsFiles.length;

    if (esmCount !== cjsCount) {
      console.log('\n❌ 文件数量不一致:');
      console.log(`   ESM 文件数: ${esmCount}`);
      console.log(`   CJS 文件数: ${cjsCount}`);
      console.log(`   差异: ${Math.abs(esmCount - cjsCount)}`);
    }

    expect(esmCount).toBe(cjsCount);
  });

  /**
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * 验证 ESM 和 CJS 中的子目录数量相同
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3i: ESM 和 CJS 中的子目录数量相同', () => {
    const esmDirs = getAllDirectoriesRecursive('dist/esm');
    const cjsDirs = getAllDirectoriesRecursive('dist/cjs');

    const esmCount = esmDirs.length;
    const cjsCount = cjsDirs.length;

    if (esmCount !== cjsCount) {
      console.log('\n❌ 子目录数量不一致:');
      console.log(`   ESM 子目录数: ${esmCount}`);
      console.log(`   CJS 子目录数: ${cjsCount}`);
      console.log(`   差异: ${Math.abs(esmCount - cjsCount)}`);
    }

    expect(esmCount).toBe(cjsCount);
  });

  /**
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * 验证 ESM 和 CJS 中的 .js 文件数量相同
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3j: ESM 和 CJS 中的 .js 文件数量相同', () => {
    const esmJsFiles = getAllFilesRecursive('dist/esm')
      .filter(f => f.endsWith('.js'));
    const cjsJsFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => f.endsWith('.js'))
      .filter(f => !f.endsWith('package.json')); // 排除 package.json

    const esmCount = esmJsFiles.length;
    const cjsCount = cjsJsFiles.length;

    if (esmCount !== cjsCount) {
      console.log('\n❌ .js 文件数量不一致:');
      console.log(`   ESM .js 文件数: ${esmCount}`);
      console.log(`   CJS .js 文件数: ${cjsCount}`);
      console.log(`   差异: ${Math.abs(esmCount - cjsCount)}`);
    }

    expect(esmCount).toBe(cjsCount);
  });

  /**
   * Feature: commonjs-build-support, Property 3: 目录结构一致性
   * 
   * 验证 ESM 和 CJS 中的 .js.map 文件数量相同
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3k: ESM 和 CJS 中的 .js.map 文件数量相同', () => {
    const esmMapFiles = getAllFilesRecursive('dist/esm')
      .filter(f => f.endsWith('.js.map'));
    const cjsMapFiles = getAllFilesRecursive('dist/cjs')
      .filter(f => f.endsWith('.js.map'));

    const esmCount = esmMapFiles.length;
    const cjsCount = cjsMapFiles.length;

    if (esmCount !== cjsCount) {
      console.log('\n❌ .js.map 文件数量不一致:');
      console.log(`   ESM .js.map 文件数: ${esmCount}`);
      console.log(`   CJS .js.map 文件数: ${cjsCount}`);
      console.log(`   差异: ${Math.abs(esmCount - cjsCount)}`);
    }

    expect(esmCount).toBe(cjsCount);
  });
});
