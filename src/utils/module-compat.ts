/**
 * 模块兼容性辅助工具
 * 
 * 提供 ESM 和 CommonJS 之间的兼容性支持
 * 
 * 注意：这个模块使用运行时检测来确定当前的模块系统
 * 在 CommonJS 构建中，全局变量 __filename、__dirname 和 require 会自动可用
 * 在 ESM 构建中，需要使用 import.meta.url 和 createRequire
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

/**
 * 检测当前是否在 CommonJS 环境中
 */
function isCommonJS(): boolean {
  // 在 CommonJS 中，__filename 是全局可用的
  // @ts-ignore - __filename 在 CommonJS 中可用
  return typeof __filename !== 'undefined';
}

/**
 * 获取当前文件的 __filename
 * 
 * 自动检测模块系统：
 * - 在 CommonJS 中使用全局 __filename
 * - 在 ESM 中需要通过其他方式获取（调用者需要提供 import.meta.url）
 */
export function getFilename(importMetaUrl?: string): string {
  // 如果在 CommonJS 环境中，直接使用全局 __filename
  if (isCommonJS()) {
    // @ts-ignore - __filename 在 CommonJS 中可用
    return __filename;
  }
  
  // 在 ESM 环境中，需要 import.meta.url
  if (importMetaUrl) {
    return fileURLToPath(importMetaUrl);
  }
  
  throw new Error('在 ESM 环境中必须提供 import.meta.url 参数');
}

/**
 * 获取当前文件的 __dirname
 * 
 * 自动检测模块系统：
 * - 在 CommonJS 中使用全局 __dirname
 * - 在 ESM 中需要通过其他方式获取（调用者需要提供 import.meta.url）
 */
export function getDirname(importMetaUrl?: string): string {
  // 如果在 CommonJS 环境中，直接使用全局 __dirname
  if (isCommonJS()) {
    // @ts-ignore - __dirname 在 CommonJS 中可用
    return __dirname;
  }
  
  // 在 ESM 环境中，需要 import.meta.url
  if (importMetaUrl) {
    return dirname(fileURLToPath(importMetaUrl));
  }
  
  throw new Error('在 ESM 环境中必须提供 import.meta.url 参数');
}

/**
 * 创建 require 函数
 * 
 * 自动检测模块系统：
 * - 在 CommonJS 中使用全局 require
 * - 在 ESM 中使用 createRequire（调用者需要提供 import.meta.url）
 */
export function getRequire(importMetaUrl?: string): NodeRequire {
  // 如果在 CommonJS 环境中，直接使用全局 require
  if (isCommonJS()) {
    // @ts-ignore - require 在 CommonJS 中可用
    return require;
  }
  
  // 在 ESM 环境中，需要 import.meta.url
  if (importMetaUrl) {
    return createRequire(importMetaUrl);
  }
  
  throw new Error('在 ESM 环境中必须提供 import.meta.url 参数');
}
