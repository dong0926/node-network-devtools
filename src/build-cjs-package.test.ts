/**
 * 测试 CommonJS 包标识文件的创建
 * 验证需求：4.1, 4.2, 4.3
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('CommonJS Package Identification', () => {
  const cjsPackageJsonPath = join(process.cwd(), 'dist/cjs/package.json');

  it('should create dist/cjs/package.json file', () => {
    // 验证需求 4.1: 文件应该存在
    expect(existsSync(cjsPackageJsonPath)).toBe(true);
  });

  it('should contain "type": "commonjs" field', () => {
    // 验证需求 4.2: 文件应该包含 type: commonjs 字段
    const content = readFileSync(cjsPackageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    
    expect(pkg.type).toBe('commonjs');
  });

  it('should only contain necessary module type declaration', () => {
    // 验证需求 4.3: 文件应该仅包含必要的模块类型声明
    const content = readFileSync(cjsPackageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    
    // 应该只有 type 字段
    const keys = Object.keys(pkg);
    expect(keys).toEqual(['type']);
    expect(keys.length).toBe(1);
  });

  it('should be valid JSON format', () => {
    // 额外验证：文件应该是有效的 JSON 格式
    const content = readFileSync(cjsPackageJsonPath, 'utf-8');
    
    expect(() => {
      JSON.parse(content);
    }).not.toThrow();
  });
});
