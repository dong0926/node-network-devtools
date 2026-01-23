/**
 * 高性能堆栈捕获器
 */
export const SmartStackCollector = {
  /**
   * 捕获当前堆栈
   * @param limit 堆栈深度限制
   * @returns 过滤后的堆栈字符串
   */
  capture(limit: number = 5): string {
    const originalLimit = Error.stackTraceLimit;
    const originalPrepare = Error.prepareStackTrace;

    Error.stackTraceLimit = limit + 5; // 多捕获一些以便过滤
    Error.prepareStackTrace = (_, stack) => stack;

    const err = new Error();
    const stack = (err.stack as unknown) as NodeJS.CallSite[] || [];

    Error.stackTraceLimit = originalLimit;
    Error.prepareStackTrace = originalPrepare;

    // 过滤并格式化
    return stack
      .map(frame => {
        const file = frame.getFileName();
        if (!file) return null;
        
        // 过滤 node_modules 和 node: 内部模块
        if (file.includes('node_modules') || file.includes('node:') || !file.includes('/') && !file.includes('\\')) {
          return null;
        }

        const func = frame.getFunctionName() || '<anonymous>';
        const line = frame.getLineNumber();
        const col = frame.getColumnNumber();

        return `at ${func} (${file}:${line}:${col})`;
      })
      .filter(Boolean)
      .slice(0, limit)
      .join('\n');
  },

  /**
   * 获取调用者信息（第一个非内部模块的帧）
   */
  getCaller(): string | undefined {
    const originalLimit = Error.stackTraceLimit;
    const originalPrepare = Error.prepareStackTrace;

    Error.stackTraceLimit = 10; 
    Error.prepareStackTrace = (_, stack) => stack;

    const err = new Error();
    const stack = (err.stack as unknown) as NodeJS.CallSite[] || [];

    Error.stackTraceLimit = originalLimit;
    Error.prepareStackTrace = originalPrepare;

    for (const frame of stack) {
      const file = frame.getFileName();
      if (!file) continue;
      
      const isInternal = 
        file.includes('node_modules') || 
        file.includes('node:') || 
        file.includes('dist/cjs') || // 跳过编译后的工具代码
        file.includes('dist/esm') ||
        file.includes('stack-collector') ||
        file.includes('trace-collector') ||
        (!file.includes('/') && !file.includes('\\'));

      if (isInternal) continue;

      const func = frame.getFunctionName() || frame.getMethodName() || '<anonymous>';
      const line = frame.getLineNumber();
      const fileName = file.split(/[/\\]/).pop();

      return `${func} (${fileName}:${line})`;
    }

    return undefined;
  }
};
