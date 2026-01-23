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

interface ExpressRequest {
  method: string;
  route?: { path: string };
  [key: string]: any;
}

interface ExpressResponse {
  on(event: string, listener: () => void): this;
  [key: string]: any;
}

type NextFunction = (err?: any) => void;

/**
 * 包装 Express 导出函数
 */
function wrapExpress(express: any) {
  const originalExpress = express;
  
  const wrappedExpress = function() {
    const app = originalExpress.apply(null, arguments);
    
    // ... (中间代码保持不变)

    // 最简单有效的方式：添加一个全局中间件，在处理完成后尝试获取路由信息
    app.use((req: ExpressRequest, _res: ExpressResponse, next: NextFunction) => {
      const session = traceManager.getSession();
      if (session) {
        // 记录框架
        session.rootNode.metadata = {
          ...session.rootNode.metadata,
          framework: 'express'
        };

        // 在 finish 时，Express 应该已经填充了 req.route
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
