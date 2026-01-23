const http = require('http');
const { setConfig, getConfig } = require('../dist/cjs/config.js');
const { ServerPatcher } = require('../dist/cjs/interceptors/server-patcher.js');

async function bench(name, iterations = 200) {
  const server = http.createServer((req, res) => {
    // 模拟一些简单的异步负载
    setImmediate(() => {
      res.end('ok');
    });
  });

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const url = `http://localhost:${port}`;

  // Warmup
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => http.get(url, (res) => { res.on('data', () => {}); res.on('end', resolve); }));
  }

  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await new Promise((resolve) => {
      http.get(url, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
    });
  }
  const end = Date.now();
  const total = end - start;
  console.log(`[${name}] Total: ${total}ms, Avg: ${(total / iterations).toFixed(3)}ms/req`);
  
  server.close();
  return total / iterations;
}

async function run() {
  console.log('--- Performance Benchmark (Server Trace) ---');
  
  // 1. Without Tracing
  setConfig({ traceEnabled: false });
  const baseline = await bench('Baseline (No Trace)');

  // 2. With Tracing Enabled
  setConfig({ traceEnabled: true });
  ServerPatcher.install();
  const withTrace = await bench('With Trace');

  const overhead = ((withTrace - baseline) / baseline) * 100;
  console.log(`--- Result ---`);
  console.log(`Overhead: ${overhead.toFixed(2)}%`);
  
  if (overhead > 50) {
    console.warn('⚠️ Warning: Performance overhead is significant (>50%)');
  } else {
    console.log('✅ Performance overhead is within acceptable range for development.');
  }
}

// 需要先编译项目
run().catch(console.error);
