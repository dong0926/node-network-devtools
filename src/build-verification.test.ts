/**
 * 构建产物验证测试
 * 
 * 此测试验证构建产物的完整性，确保：
 * 1. dist/esm 目录存在
 * 2. dist/cjs 目录存在
 * 3. dist/types 目录存在
 * 4. dist/cjs/package.json 存在且内容正确
 * 
 * **Validates: Requirements 1.1, 4.1, 4.2, 4.3**
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Build Output Verification', () => {
  describe('Directory Structure', () => {
    it('should have dist/esm directory', () => {
      const esmDir = path.join(rootDir, 'dist/esm');
      expect(fs.existsSync(esmDir), 'dist/esm 目录应该存在').toBe(true);
      
      // 验证是目录而不是文件
      const stat = fs.statSync(esmDir);
      expect(stat.isDirectory(), 'dist/esm 应该是一个目录').toBe(true);
    });

    it('should have dist/cjs directory', () => {
      const cjsDir = path.join(rootDir, 'dist/cjs');
      expect(fs.existsSync(cjsDir), 'dist/cjs 目录应该存在').toBe(true);
      
      // 验证是目录而不是文件
      const stat = fs.statSync(cjsDir);
      expect(stat.isDirectory(), 'dist/cjs 应该是一个目录').toBe(true);
    });

    it('should have dist/types directory', () => {
      const typesDir = path.join(rootDir, 'dist/types');
      expect(fs.existsSync(typesDir), 'dist/types 目录应该存在').toBe(true);
      
      // 验证是目录而不是文件
      const stat = fs.statSync(typesDir);
      expect(stat.isDirectory(), 'dist/types 应该是一个目录').toBe(true);
    });

    it('should have dist/gui directory', () => {
      const guiDir = path.join(rootDir, 'dist/gui');
      expect(fs.existsSync(guiDir), 'dist/gui 目录应该存在').toBe(true);
      
      // 验证是目录而不是文件
      const stat = fs.statSync(guiDir);
      expect(stat.isDirectory(), 'dist/gui 应该是一个目录').toBe(true);
    });
  });

  describe('CommonJS Package Identifier', () => {
    it('should have dist/cjs/package.json file', () => {
      const pkgPath = path.join(rootDir, 'dist/cjs/package.json');
      expect(fs.existsSync(pkgPath), 'dist/cjs/package.json 文件应该存在').toBe(true);
      
      // 验证是文件而不是目录
      const stat = fs.statSync(pkgPath);
      expect(stat.isFile(), 'dist/cjs/package.json 应该是一个文件').toBe(true);
    });

    it('should have correct content in dist/cjs/package.json', () => {
      const pkgPath = path.join(rootDir, 'dist/cjs/package.json');
      
      // 读取文件内容
      const content = fs.readFileSync(pkgPath, 'utf-8');
      
      // 解析 JSON
      let parsed;
      expect(() => {
        parsed = JSON.parse(content);
      }, 'dist/cjs/package.json 应该是有效的 JSON').not.toThrow();
      
      // 验证内容
      expect(parsed).toBeDefined();
      expect(parsed.type).toBe('commonjs');
    });

    it('should have only type field in dist/cjs/package.json', () => {
      const pkgPath = path.join(rootDir, 'dist/cjs/package.json');
      const content = fs.readFileSync(pkgPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // 验证只有 type 字段
      const keys = Object.keys(parsed);
      expect(keys).toEqual(['type']);
    });
  });

  describe('ESM Build Output', () => {
    it('should have key entry files in dist/esm', () => {
      const esmDir = path.join(rootDir, 'dist/esm');
      const keyFiles = ['index.js', 'register.js', 'cli.js', 'config.js'];
      
      for (const file of keyFiles) {
        const filePath = path.join(esmDir, file);
        expect(fs.existsSync(filePath), `dist/esm/${file} 应该存在`).toBe(true);
      }
    });

    it('should have subdirectories in dist/esm', () => {
      const esmDir = path.join(rootDir, 'dist/esm');
      const subdirs = ['adapters', 'context', 'gui', 'interceptors', 'store', 'utils'];
      
      for (const subdir of subdirs) {
        const subdirPath = path.join(esmDir, subdir);
        expect(fs.existsSync(subdirPath), `dist/esm/${subdir} 目录应该存在`).toBe(true);
        
        const stat = fs.statSync(subdirPath);
        expect(stat.isDirectory(), `dist/esm/${subdir} 应该是一个目录`).toBe(true);
      }
    });
  });

  describe('CJS Build Output', () => {
    it('should have key entry files in dist/cjs', () => {
      const cjsDir = path.join(rootDir, 'dist/cjs');
      const keyFiles = ['index.js', 'register.js', 'cli.js', 'config.js'];
      
      for (const file of keyFiles) {
        const filePath = path.join(cjsDir, file);
        expect(fs.existsSync(filePath), `dist/cjs/${file} 应该存在`).toBe(true);
      }
    });

    it('should have subdirectories in dist/cjs', () => {
      const cjsDir = path.join(rootDir, 'dist/cjs');
      const subdirs = ['adapters', 'context', 'gui', 'interceptors', 'store', 'utils'];
      
      for (const subdir of subdirs) {
        const subdirPath = path.join(cjsDir, subdir);
        expect(fs.existsSync(subdirPath), `dist/cjs/${subdir} 目录应该存在`).toBe(true);
        
        const stat = fs.statSync(subdirPath);
        expect(stat.isDirectory(), `dist/cjs/${subdir} 应该是一个目录`).toBe(true);
      }
    });
  });

  describe('TypeScript Type Definitions', () => {
    it('should have key type definition files in dist/types', () => {
      const typesDir = path.join(rootDir, 'dist/types');
      const keyFiles = ['index.d.ts', 'register.d.ts', 'cli.d.ts', 'config.d.ts'];
      
      for (const file of keyFiles) {
        const filePath = path.join(typesDir, file);
        expect(fs.existsSync(filePath), `dist/types/${file} 应该存在`).toBe(true);
      }
    });

    it('should have type definition source maps', () => {
      const typesDir = path.join(rootDir, 'dist/types');
      const keyFiles = ['index.d.ts.map', 'register.d.ts.map', 'cli.d.ts.map', 'config.d.ts.map'];
      
      for (const file of keyFiles) {
        const filePath = path.join(typesDir, file);
        expect(fs.existsSync(filePath), `dist/types/${file} 应该存在`).toBe(true);
      }
    });
  });

  describe('Source Maps', () => {
    it('should have source maps for ESM files', () => {
      const esmDir = path.join(rootDir, 'dist/esm');
      const keyFiles = ['index.js', 'register.js', 'cli.js', 'config.js'];
      
      for (const file of keyFiles) {
        const mapFile = file + '.map';
        const mapPath = path.join(esmDir, mapFile);
        expect(fs.existsSync(mapPath), `dist/esm/${mapFile} 应该存在`).toBe(true);
      }
    });

    it('should have source maps for CJS files', () => {
      const cjsDir = path.join(rootDir, 'dist/cjs');
      const keyFiles = ['index.js', 'register.js', 'cli.js', 'config.js'];
      
      for (const file of keyFiles) {
        const mapFile = file + '.map';
        const mapPath = path.join(cjsDir, mapFile);
        expect(fs.existsSync(mapPath), `dist/cjs/${mapFile} 应该存在`).toBe(true);
      }
    });
  });

  describe('GUI Build Output', () => {
    it('should have index.html in dist/gui', () => {
      const indexPath = path.join(rootDir, 'dist/gui/index.html');
      expect(fs.existsSync(indexPath), 'dist/gui/index.html 应该存在').toBe(true);
    });

    it('should have assets directory in dist/gui', () => {
      const assetsDir = path.join(rootDir, 'dist/gui/assets');
      expect(fs.existsSync(assetsDir), 'dist/gui/assets 目录应该存在').toBe(true);
      
      const stat = fs.statSync(assetsDir);
      expect(stat.isDirectory(), 'dist/gui/assets 应该是一个目录').toBe(true);
    });
  });

  describe('Build Completeness', () => {
    it('should have non-empty ESM directory', () => {
      const esmDir = path.join(rootDir, 'dist/esm');
      const files = fs.readdirSync(esmDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should have non-empty CJS directory', () => {
      const cjsDir = path.join(rootDir, 'dist/cjs');
      const files = fs.readdirSync(cjsDir);
      // CJS 目录应该至少有 package.json 和一些 JS 文件
      expect(files.length).toBeGreaterThan(1);
      expect(files).toContain('package.json');
    });

    it('should have non-empty types directory', () => {
      const typesDir = path.join(rootDir, 'dist/types');
      const files = fs.readdirSync(typesDir);
      expect(files.length).toBeGreaterThan(0);
    });
  });
});
