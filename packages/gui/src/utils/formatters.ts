/**
 * 格式化工具函数
 */

/**
 * 格式化字节大小
 * 
 * @param bytes - 字节数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 格式化耗时
 * 
 * @param ms - 毫秒数
 * @returns 格式化后的字符串
 */
export function formatTime(ms: number | undefined): string {
  if (ms === undefined) return '-';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * 尝试格式化 JSON
 * 
 * @param text - 原始文本
 * @returns 格式化结果
 */
export function tryFormatJson(text: string): { formatted: string; isJson: boolean } {
  try {
    const parsed = JSON.parse(text);
    return {
      formatted: JSON.stringify(parsed, null, 2),
      isJson: true,
    };
  } catch {
    return {
      formatted: text,
      isJson: false,
    };
  }
}

/**
 * 从 URL 提取路径
 * 
 * @param url - 完整 URL
 * @returns 路径部分
 */
export function extractUrlPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

/**
 * 从 URL 推断请求类型
 * 
 * @param url - 请求 URL
 * @returns 请求类型
 */
export function inferRequestType(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) return 'script';
    if (pathname.endsWith('.css')) return 'stylesheet';
    if (pathname.endsWith('.json')) return 'json';
    if (pathname.endsWith('.html') || pathname.endsWith('.htm')) return 'document';
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(pathname)) return 'image';
    if (/\.(woff|woff2|ttf|otf|eot)$/.test(pathname)) return 'font';
    
    return 'fetch';
  } catch {
    return 'fetch';
  }
}

/**
 * 截断长文本
 * 
 * @param text - 原始文本
 * @param maxLength - 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
