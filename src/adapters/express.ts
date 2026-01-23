import { traceManager } from '../context/trace-manager.js';

/**
 * Express 适配器
 * 
 * 专门用于提取 Express 框架层面的信息（如路由模式）
 */
export const ExpressAdapter = {
  install() {
    try {
      if (typeof require === 'undefined') return;

      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function(id: string) {
        const exports = originalRequire.apply(this, arguments);

        if (id === 'express' || id.endsWith('/express')) {
          return wrapExpress(exports);
        }

        return exports;
      };
    } catch (e) {
      // Ignore
    }
  }
};

/**
 * 包装 Express 导出函数
 */
function wrapExpress(express: any) {
  const originalExpress = express;
  
  const wrappedExpress = function() {
    const app = originalExpress.apply(null, arguments);
    
    // 注入中间件来捕获路由信息
    // 注意：我们需要在所有路由之前运行，或者通过监听 mount 事件
    const originalUse = app.use;
    app.use = function(firstArg: any) {
      // 如果第一个参数不是字符串或正则，说明是通用中间件
      // 我们更感兴趣的是具体的路由处理
      return originalUse.apply(this, arguments);
    };

    // 拦截路由方法以捕获模式
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    methods.forEach(method => {
      const originalMethod = app[method];
      app[method] = function(path: any) {
        if (typeof path === 'string' || path instanceof RegExp) {
          // 这里可以包装 handler 来捕获路径，但 Express 比较复杂
          // 另一种方式是使用中间件在请求结束前检查 req.route.path
        }
        return originalMethod.apply(this, arguments);
      };
    });

    // 最简单有效的方式：添加一个全局中间件，在处理完成后尝试获取路由信息
    app.use((req: any, _res: any, next: any) => {
      const session = traceManager.getSession();
      if (session) {
        // 记录框架
        session.rootNode.metadata = {
          ...session.rootNode.metadata,
          framework: 'express'
        };

        // 在 finish 时，Express 应该已经填充了 req.route
        // 实际上，我们可以在这个中间件的 next() 之后尝试获取，
        // 或者监听 'finish'。为了确保在 ServerPatcher 处理聚合之前运行，
        // 我们需要确保我们的监听器先注册，或者直接在这里处理。
        _res.on('finish', () => {
          if (req.route && req.route.path) {
            session.rootNode.metadata!.route = req.route.path;
            session.rootNode.name = `${req.method} ${req.route.path}`;
          }
        });
      }
      next();
    });

    return app;
  };

  const originalFactory = typeof express === 'function' ? express : express.default;
  if (typeof originalFactory !== 'function') return express;

  const wrappedFactory = Object.assign(wrappedExpress, originalFactory);
  
  if (typeof express === 'function') {
    return wrappedFactory;
  } else {
    express.default = wrappedFactory;
    return express;
  }
}
