const http = require('http');

async function bench(url, iterations = 100) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await new Promise((resolve) => {
      http.get(url, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      }).on('error', resolve);
    });
  }
  const end = Date.now();
  console.log(`${url}: ${end - start}ms for ${iterations} iterations (${(end - start) / iterations}ms/req)`);
}

async function run() {
  console.log('Starting benchmark...');
  await bench('http://localhost:3000');
}

run();
