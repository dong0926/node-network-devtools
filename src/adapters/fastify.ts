import { traceManager } from '../context/trace-manager.js';

/**
 * Fastify 适配器
 * 
 * 专门用于提取 Fastify 框架层面的信息（如路由模式）
 */
export const FastifyAdapter = {
  install() {
    try {
      // 检查是否在 Node.js 环境且可以使用 require
      if (typeof require === 'undefined') return;

      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function(id: string) {
        const exports = originalRequire.apply(this, arguments);

        if (id === 'fastify' || id.endsWith('/fastify')) {
          return wrapFastify(exports);
        }

        return exports;
      };
    } catch (e) {
      // Ignore
    }
  }
};

/**
 * 包装 Fastify 导出函数
 */
function wrapFastify(fastify: any) {
  // 处理 fastify 默认导出可能是函数也可能是对象（含 default）的情况
  const originalFactory = typeof fastify === 'function' ? fastify : fastify.default;
  if (typeof originalFactory !== 'function') return fastify;

  const wrappedFactory = function() {
    const instance = originalFactory.apply(null, arguments);

    // 添加 onRoute hook 以记录所有定义的路由（可选）
    // 添加 preHandler hook 来捕获匹配的路由信息
    instance.addHook('preHandler', (request: any, reply: any, done: any) => {
      const session = traceManager.getSession();
      if (session && request.routeOptions) {
        // 将路由模式记录到根节点元数据
        const routePath = request.routeOptions.url;
        session.rootNode.metadata = {
          ...session.rootNode.metadata,
          route: routePath,
          framework: 'fastify'
        };
        // 更新根节点名称以包含路由信息
        session.rootNode.name = `${request.method} ${routePath}`;
      }
      done();
    });

    return instance;
  };

  // 复制静态属性和方法（如 fastify.errorCodes 等）
  Object.assign(wrappedFactory, originalFactory);
  
  if (typeof fastify === 'function') {
    return wrappedFactory;
  } else {
    fastify.default = wrappedFactory;
    return fastify;
  }
}
