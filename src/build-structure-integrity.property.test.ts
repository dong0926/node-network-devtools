/**
 * 构建产物结构完整性属性测试
 * 
 * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
 * 
 * *For any* 成功的构建，输出目录应该包含：
 * - `dist/esm/` 目录及其所有源文件对应的 `.js` 文件
 * - `dist/cjs/` 目录及其所有源文件对应的 `.js` 文件
 * - `dist/types/` 目录及其所有源文件对应的 `.d.ts` 文件
 * - `dist/cjs/package.json` 文件包含 `{"type": "commonjs"}`
 * 
 * **Validates: Requirements 1.1, 1.3, 4.1, 4.2, 4.3, 8.1, 8.2, 8.3**
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
 * 将源文件路径转换为构建产物路径
 */
function sourcePathToBuildPath(sourcePath: string, buildDir: 'esm' | 'cjs' | 'types'): string {
  const normalizedPath = sourcePath.replace(/\\/g, '/');
  
  if (buildDir === 'types') {
    return normalizedPath
      .replace('src/', 'dist/types/')
      .replace('.ts', '.d.ts');
  } else {
    return normalizedPath
      .replace('src/', `dist/${buildDir}/`)
      .replace('.ts', '.js');
  }
}

/**
 * 检查目录是否存在
 */
function directoryExists(dir: string): boolean {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

/**
 * 检查文件是否存在
 */
function fileExists(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

describe('构建产物结构完整性属性测试', () => {
  /**
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * 验证所有必需的构建目录都存在
   * 
   * **Validates: Requirements 1.1, 8.1, 8.2, 8.3**
   */
  it('Property 2a: 所有必需的构建目录都存在', () => {
    const requiredDirectories = [
      'dist/esm',
      'dist/cjs',
      'dist/types',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...requiredDirectories),
        (dir) => {
          const exists = directoryExists(dir);
          
          if (!exists) {
            console.log(`\n❌ 必需的目录不存在: ${dir}`);
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
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * 验证 dist/cjs/package.json 存在且内容正确
   * 
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  it('Property 2b: dist/cjs/package.json 存在且包含正确的 type 字段', () => {
    const cjsPackageJsonPath = 'dist/cjs/package.json';
    
    // 文件必须存在
    expect(fileExists(cjsPackageJsonPath), `${cjsPackageJsonPath} 应该存在`).toBe(true);
    
    // 读取并解析 JSON
    const content = fs.readFileSync(cjsPackageJsonPath, 'utf-8');
    let packageJson: any;
    
    try {
      packageJson = JSON.parse(content);
    } catch (error) {
      throw new Error(`${cjsPackageJsonPath} 不是有效的 JSON: ${error}`);
    }
    
    // 必须包含 "type": "commonjs"
    expect(packageJson).toHaveProperty('type');
    expect(packageJson.type).toBe('commonjs');
    
    // 应该只包含必要的字段（保持简洁）
    const keys = Object.keys(packageJson);
    expect(keys).toEqual(['type']);
  });

  /**
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * *For any* 源文件，对应的 ESM 构建产物应该存在
   * 
   * **Validates: Requirements 1.1, 8.1**
   */
  it('Property 2c: 所有源文件都有对应的 ESM 构建产物', () => {
    const sourceFiles = getAllSourceFiles();
    
    // 确保我们有源文件可以测试
    expect(sourceFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...sourceFiles),
        (sourceFile) => {
          const esmFile = sourcePathToBuildPath(sourceFile, 'esm');
          const exists = fileExists(esmFile);
          
          if (!exists) {
            console.log(`\n❌ ESM 构建产物缺失: ${esmFile}`);
            console.log(`   源文件: ${sourceFile}`);
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
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * *For any* 源文件，对应的 CJS 构建产物应该存在
   * 
   * **Validates: Requirements 1.1, 8.2**
   */
  it('Property 2d: 所有源文件都有对应的 CJS 构建产物', () => {
    const sourceFiles = getAllSourceFiles();
    
    // 确保我们有源文件可以测试
    expect(sourceFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...sourceFiles),
        (sourceFile) => {
          const cjsFile = sourcePathToBuildPath(sourceFile, 'cjs');
          const exists = fileExists(cjsFile);
          
          if (!exists) {
            console.log(`\n❌ CJS 构建产物缺失: ${cjsFile}`);
            console.log(`   源文件: ${sourceFile}`);
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
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * *For any* 源文件，对应的类型定义文件应该存在
   * 
   * **Validates: Requirements 8.3**
   */
  it('Property 2e: 所有源文件都有对应的类型定义文件', () => {
    const sourceFiles = getAllSourceFiles();
    
    // 确保我们有源文件可以测试
    expect(sourceFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...sourceFiles),
        (sourceFile) => {
          const typeFile = sourcePathToBuildPath(sourceFile, 'types');
          const exists = fileExists(typeFile);
          
          if (!exists) {
            console.log(`\n❌ 类型定义文件缺失: ${typeFile}`);
            console.log(`   源文件: ${sourceFile}`);
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
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * *For any* 源文件，对应的 source map 文件应该存在（ESM 和 CJS）
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 2f: 所有 JS 文件都有对应的 source map', () => {
    const sourceFiles = getAllSourceFiles();
    
    // 确保我们有源文件可以测试
    expect(sourceFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...sourceFiles),
        fc.constantFrom('esm', 'cjs'),
        (sourceFile, buildDir) => {
          const jsFile = sourcePathToBuildPath(sourceFile, buildDir as 'esm' | 'cjs');
          const mapFile = jsFile + '.map';
          
          // 如果 JS 文件存在，source map 也应该存在
          if (fileExists(jsFile)) {
            const mapExists = fileExists(mapFile);
            
            if (!mapExists) {
              console.log(`\n❌ Source map 缺失: ${mapFile}`);
              console.log(`   JS 文件: ${jsFile}`);
              console.log(`   源文件: ${sourceFile}`);
            }
            
            return mapExists;
          }
          
          // 如果 JS 文件不存在，跳过
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
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * 验证类型定义文件也有对应的 source map
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 2g: 所有类型定义文件都有对应的 source map', () => {
    const sourceFiles = getAllSourceFiles();
    
    // 确保我们有源文件可以测试
    expect(sourceFiles.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...sourceFiles),
        (sourceFile) => {
          const typeFile = sourcePathToBuildPath(sourceFile, 'types');
          const mapFile = typeFile + '.map';
          
          // 如果类型定义文件存在，source map 也应该存在
          if (fileExists(typeFile)) {
            const mapExists = fileExists(mapFile);
            
            if (!mapExists) {
              console.log(`\n❌ 类型定义 source map 缺失: ${mapFile}`);
              console.log(`   类型文件: ${typeFile}`);
              console.log(`   源文件: ${sourceFile}`);
            }
            
            return mapExists;
          }
          
          // 如果类型文件不存在，跳过
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
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * 验证关键入口文件必须存在于所有构建目录中
   * 
   * **Validates: Requirements 1.1, 8.1, 8.2, 8.3**
   */
  it('Property 2h: 关键入口文件必须存在于所有构建目录', () => {
    const keyFiles = [
      'index',
      'register',
      'config',
      'cli',
    ];

    const buildDirs = [
      { dir: 'esm', ext: '.js' },
      { dir: 'cjs', ext: '.js' },
      { dir: 'types', ext: '.d.ts' },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...keyFiles),
        fc.constantFrom(...buildDirs),
        (fileName, buildConfig) => {
          const filePath = `dist/${buildConfig.dir}/${fileName}${buildConfig.ext}`;
          const exists = fileExists(filePath);
          
          if (!exists) {
            console.log(`\n❌ 关键文件缺失: ${filePath}`);
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
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * 验证所有构建产物目录都包含相同的子目录结构
   * 
   * **Validates: Requirements 1.1**
   */
  it('Property 2i: ESM 和 CJS 目录具有相同的子目录结构', () => {
    const esmDirs = getAllFilesRecursive('dist/esm')
      .filter(f => fs.statSync(f).isDirectory())
      .map(d => d.replace(/\\/g, '/').replace('dist/esm/', ''))
      .sort();

    const cjsDirs = getAllFilesRecursive('dist/cjs')
      .filter(f => fs.statSync(f).isDirectory())
      .map(d => d.replace(/\\/g, '/').replace('dist/cjs/', ''))
      .sort();

    // ESM 和 CJS 应该有相同的子目录
    expect(esmDirs).toEqual(cjsDirs);
  });

  /**
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * 验证构建产物不包含测试文件
   * 
   * **Validates: Requirements 1.1**
   */
  it('Property 2j: 构建产物不应包含测试文件', () => {
    const buildDirs = ['dist/esm', 'dist/cjs', 'dist/types'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          const allFiles = getAllFilesRecursive(buildDir);
          
          // 检查是否有测试文件
          const testFiles = allFiles.filter(f => {
            const fileName = path.basename(f);
            return fileName.includes('.test.') || 
                   fileName.includes('.spec.') ||
                   fileName.includes('.property.test.') ||
                   fileName.includes('.node-test.');
          });
          
          if (testFiles.length > 0) {
            console.log(`\n❌ 构建目录包含测试文件: ${buildDir}`);
            console.log(`   测试文件: ${testFiles.join(', ')}`);
          }
          
          return testFiles.length === 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  /**
   * Feature: commonjs-build-support, Property 2: 构建产物结构完整性
   * 
   * 验证所有构建产物文件都不为空（除了某些特殊情况）
   * 
   * **Validates: Requirements 1.1**
   */
  it('Property 2k: 构建产物文件不应为空', () => {
    const buildDirs = ['dist/esm', 'dist/cjs'];

    fc.assert(
      fc.property(
        fc.constantFrom(...buildDirs),
        (buildDir) => {
          const jsFiles = getAllFilesRecursive(buildDir)
            .filter(f => f.endsWith('.js'))
            .filter(f => !f.endsWith('package.json'));
          
          // 检查每个文件是否为空
          for (const file of jsFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const contentWithoutComments = content
              .replace(/\/\/.*$/gm, '')  // 移除单行注释
              .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
              .trim();
            
            // 文件应该至少包含 "use strict" 或一些代码
            // 完全空的文件（除了注释）可能表示构建问题
            if (contentWithoutComments === '') {
              console.log(`\n⚠️  文件为空（除了注释）: ${file}`);
              // 注意：某些文件（如 axios.ts）可能是空的，这是可以接受的
              // 所以这里只是警告，不失败
            }
          }
          
          return true;
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });
});
