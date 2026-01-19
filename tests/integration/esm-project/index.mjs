/**
 * ESM 集成测试
 * 
 * 测试 @mt0926/node-network-devtools 在 ESM 环境中的导入和基本功能
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置模块路径，指向项目根目录的构建产物
const distEsmPath = path.resolve(__dirname, '../../../dist/esm');

// 辅助函数：将路径转换为 file:// URL（Windows 兼容）
function toFileURL(filePath) {
  return pathToFileURL(filePath).href;
}

console.log('=== ESM 集成测试 ===\n');
console.log(`测试路径: ${distEsmPath}\n`);

// 测试 1: 导入主入口
console.log('测试 1: 导入主入口...');
try {
  const nnd = await import(toFileURL(path.join(distEsmPath, 'index.js')));
  
  // 验证导出的函数存在
  const requiredExports = [
    'getConfig',
    'setConfig',
    'resetConfig',
    'getRequestStore',
    'resetRequestStore',
    'createRequestStore',
    'generateTraceId',
    'getCurrentTraceId',
    'getCurrentContext',
    'startTrace',
    'runWithContext',
    'HttpPatcher',
    'UndiciPatcher',
    'getGUIServer',
    'resetGUIServer',
    'createGUIServer',
    'install',
    'startGUI',
    'stopGUI'
  ];
  
  const missingExports = requiredExports.filter(name => {
    const exported = nnd[name];
    return exported === undefined || (typeof exported !== 'function' && typeof exported !== 'object');
  });
  
  if (missingExports.length > 0) {
    console.error(`✗ 缺少导出: ${missingExports.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✓ 主入口导入成功');
  console.log(`✓ 所有必需的导出都存在 (${requiredExports.length} 个)`);
} catch (error) {
  console.error('✗ 主入口导入失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// 测试 2: 导入 register 入口
console.log('\n测试 2: 导入 register 入口...');
try {
  await import(toFileURL(path.join(distEsmPath, 'register.js')));
  console.log('✓ register 入口导入成功');
} catch (error) {
  console.error('✗ register 入口导入失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// 测试 3: 验证基本功能
console.log('\n测试 3: 验证基本功能...');
try {
  const { getRequestStore, getConfig, setConfig } = await import(toFileURL(path.join(distEsmPath, 'index.js')));
  
  // 测试配置
  const config = getConfig();
  if (!config || typeof config !== 'object') {
    throw new Error('getConfig() 返回值无效');
  }
  console.log('✓ getConfig() 工作正常');
  
  // 测试配置更新
  setConfig({ maxRequests: 500 });
  const updatedConfig = getConfig();
  if (updatedConfig.maxRequests !== 500) {
    throw new Error('setConfig() 未生效');
  }
  console.log('✓ setConfig() 工作正常');
  
  // 测试请求存储
  const store = getRequestStore();
  if (!store || typeof store.getAll !== 'function') {
    throw new Error('getRequestStore() 返回值无效');
  }
  console.log('✓ getRequestStore() 工作正常');
  
  // 测试存储方法
  const requests = store.getAll();
  if (!Array.isArray(requests)) {
    throw new Error('store.getAll() 应该返回数组');
  }
  console.log('✓ store.getAll() 工作正常');
  
} catch (error) {
  console.error('✗ 基本功能测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// 测试 4: 验证拦截器可以启用
console.log('\n测试 4: 验证拦截器可以启用...');
try {
  const { HttpPatcher, UndiciPatcher } = await import(toFileURL(path.join(distEsmPath, 'index.js')));
  
  // 验证拦截器类存在
  if (typeof HttpPatcher !== 'function' && typeof HttpPatcher !== 'object') {
    throw new Error('HttpPatcher 不存在或类型错误');
  }
  console.log('✓ HttpPatcher 存在');
  
  if (typeof UndiciPatcher !== 'function' && typeof UndiciPatcher !== 'object') {
    throw new Error('UndiciPatcher 不存在或类型错误');
  }
  console.log('✓ UndiciPatcher 存在');
  
  // 验证拦截器有 install 和 uninstall 方法
  if (typeof HttpPatcher.install !== 'function') {
    throw new Error('HttpPatcher.install 不是函数');
  }
  console.log('✓ HttpPatcher.install 方法存在');
  
  if (typeof UndiciPatcher.install !== 'function') {
    throw new Error('UndiciPatcher.install 不是函数');
  }
  console.log('✓ UndiciPatcher.install 方法存在');
  
} catch (error) {
  console.error('✗ 拦截器测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// 测试 5: 验证模块格式
console.log('\n测试 5: 验证模块格式...');
try {
  // 在 ESM 环境中，import 应该返回一个模块对象
  const nnd = await import(toFileURL(path.join(distEsmPath, 'index.js')));
  
  if (typeof nnd !== 'object' || nnd === null) {
    throw new Error('import 应该返回一个对象');
  }
  
  // ESM 模块不应该有 default 导出（除非明确定义）
  // 我们的包使用命名导出，所以不应该有 default
  if (nnd.default !== undefined) {
    console.warn('⚠ 警告: 检测到 default 导出，这可能不是预期的');
  }
  
  console.log('✓ 模块格式正确（ESM）');
  
} catch (error) {
  console.error('✗ 模块格式验证失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// 测试 6: 验证命名导入
console.log('\n测试 6: 验证命名导入...');
try {
  // 测试解构导入
  const { getConfig, getRequestStore, HttpPatcher } = await import(toFileURL(path.join(distEsmPath, 'index.js')));
  
  if (typeof getConfig !== 'function') {
    throw new Error('getConfig 解构导入失败');
  }
  console.log('✓ 命名导入 getConfig 成功');
  
  if (typeof getRequestStore !== 'function') {
    throw new Error('getRequestStore 解构导入失败');
  }
  console.log('✓ 命名导入 getRequestStore 成功');
  
  if (typeof HttpPatcher !== 'object' && typeof HttpPatcher !== 'function') {
    throw new Error('HttpPatcher 解构导入失败');
  }
  console.log('✓ 命名导入 HttpPatcher 成功');
  
} catch (error) {
  console.error('✗ 命名导入测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// 所有测试通过
console.log('\n=== 所有测试通过 ✓ ===');
console.log('ESM 集成测试成功完成！\n');
process.exit(0);
