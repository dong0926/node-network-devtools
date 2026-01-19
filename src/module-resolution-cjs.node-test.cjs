/**
 * CommonJS 模块解析测试
 * 
 * 此测试验证 CommonJS 环境中的模块解析功能，确保：
 * 1. 使用 require() 可以正确导入主入口
 * 2. 使用 require() 可以正确导入 register 入口
 * 3. 导入的对象包含预期的导出
 * 
 * **Validates: Requirements 2.1, 2.3**
 * 
 * 注意：此文件使用 .cjs 扩展名以确保在 CommonJS 环境中运行
 */

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

// 获取包的根目录
const rootDir = path.resolve(__dirname, '..');
const packageName = '@mt0926/node-network-devtools';

test('CommonJS Module Resolution', async (t) => {
  await t.test('should resolve main entry with require()', () => {
    // 测试主入口导入
    let pkg;
    assert.doesNotThrow(() => {
      pkg = require(path.join(rootDir, 'dist/cjs/index.js'));
    }, 'require() 主入口应该不抛出错误');

    // 验证导入的对象存在
    assert.ok(pkg, '导入的包对象应该存在');
    assert.strictEqual(typeof pkg, 'object', '导入的包应该是一个对象');
  });

  await t.test('should have expected exports in main entry', () => {
    const pkg = require(path.join(rootDir, 'dist/cjs/index.js'));

    // 验证核心导出存在
    const expectedExports = [
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

    for (const exportName of expectedExports) {
      assert.ok(
        exportName in pkg,
        `导出 "${exportName}" 应该存在于主入口中`
      );
      
      // 验证导出的类型（函数或类）
      const exportType = typeof pkg[exportName];
      assert.ok(
        exportType === 'function' || exportType === 'object',
        `导出 "${exportName}" 应该是函数或对象，实际是 ${exportType}`
      );
    }
  });

  await t.test('should resolve register entry with require()', () => {
    // 测试 register 入口导入
    // register 入口没有导出，只是执行副作用
    assert.doesNotThrow(() => {
      require(path.join(rootDir, 'dist/cjs/register.js'));
    }, 'require() register 入口应该不抛出错误');
  });

  await t.test('should have correct module.exports structure', () => {
    const pkg = require(path.join(rootDir, 'dist/cjs/index.js'));

    // 验证这是一个 CommonJS 模块导出
    assert.ok(pkg, '模块应该有导出');
    assert.strictEqual(typeof pkg, 'object', '模块导出应该是一个对象');

    // 验证没有 default 导出（CommonJS 风格）
    // 注意：如果使用了 esModuleInterop，可能会有 default 属性
    // 但主要的导出应该是命名导出
    assert.ok(
      Object.keys(pkg).length > 0,
      '模块应该有命名导出'
    );
  });

  await t.test('should be able to destructure imports', () => {
    // 测试解构导入
    let getConfig, getRequestStore;
    assert.doesNotThrow(() => {
      ({ getConfig, getRequestStore } = require(path.join(rootDir, 'dist/cjs/index.js')));
    }, '应该能够解构导入');

    assert.strictEqual(typeof getConfig, 'function', 'getConfig 应该是一个函数');
    assert.strictEqual(typeof getRequestStore, 'function', 'getRequestStore 应该是一个函数');
  });

  await t.test('should work with multiple require() calls', () => {
    // 测试多次 require 返回相同的实例（CommonJS 缓存）
    const pkg1 = require(path.join(rootDir, 'dist/cjs/index.js'));
    const pkg2 = require(path.join(rootDir, 'dist/cjs/index.js'));

    assert.strictEqual(
      pkg1,
      pkg2,
      '多次 require() 应该返回相同的缓存实例'
    );
  });

  await t.test('should have correct file extension (.js)', () => {
    const fs = require('fs');
    const mainEntry = path.join(rootDir, 'dist/cjs/index.js');
    const registerEntry = path.join(rootDir, 'dist/cjs/register.js');

    assert.ok(fs.existsSync(mainEntry), '主入口文件应该存在');
    assert.ok(fs.existsSync(registerEntry), 'register 入口文件应该存在');

    // 验证文件扩展名是 .js
    assert.ok(mainEntry.endsWith('.js'), '主入口应该是 .js 文件');
    assert.ok(registerEntry.endsWith('.js'), 'register 入口应该是 .js 文件');
  });

  await t.test('should contain CommonJS patterns in compiled code', () => {
    const fs = require('fs');
    const mainEntry = path.join(rootDir, 'dist/cjs/index.js');
    const content = fs.readFileSync(mainEntry, 'utf-8');

    // 验证包含 CommonJS 特征
    const hasCommonJSExports = 
      content.includes('exports.') || 
      content.includes('module.exports') ||
      content.includes('Object.defineProperty(exports');

    assert.ok(
      hasCommonJSExports,
      'CJS 文件应该包含 CommonJS 导出模式（exports. 或 module.exports）'
    );

    // 验证包含 require 调用（用于导入依赖）
    const hasRequire = content.includes('require(');
    assert.ok(
      hasRequire,
      'CJS 文件应该包含 require() 调用'
    );
  });

  await t.test('should not contain ESM patterns in compiled code', () => {
    const fs = require('fs');
    const mainEntry = path.join(rootDir, 'dist/cjs/index.js');
    const content = fs.readFileSync(mainEntry, 'utf-8');

    // 验证不包含 ESM 特征
    // 注意：注释中可能包含这些关键字，所以这个测试可能需要更精确
    const hasESMImport = /^import\s+/m.test(content);
    const hasESMExport = /^export\s+/m.test(content);

    assert.ok(
      !hasESMImport,
      'CJS 文件不应该包含 ESM import 语句'
    );
    assert.ok(
      !hasESMExport,
      'CJS 文件不应该包含 ESM export 语句'
    );
  });
});

console.log('✅ CommonJS 模块解析测试完成');
