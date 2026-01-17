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
};

module.exports = nextConfig;
