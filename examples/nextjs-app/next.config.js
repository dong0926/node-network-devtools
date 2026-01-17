/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 instrumentation hook
  experimental: {
    instrumentationHook: true,
  },
  
  // 允许从外部域名加载图片（示例用）
  images: {
    domains: ['jsonplaceholder.typicode.com'],
  },

  // Webpack 配置：排除服务端专用依赖（备用方案）
  // 注意：node-network-devtools 已经在源代码中使用 eval 避免静态分析
  // 这个配置是额外的保护层
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 在客户端打包时，排除这些服务端专用的包
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // 排除 Node.js 内置模块
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        
        // 排除服务端专用依赖
        puppeteer: false,
        'source-map-support': false,
        typescript: false,
      };

      // 忽略可选依赖的警告（如果仍然出现）
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /node_modules\/puppeteer/ },
        { module: /node_modules\/import-fresh/ },
        { module: /node_modules\/cosmiconfig/ },
        { module: /node_modules\/typescript/ },
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
