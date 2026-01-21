import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const testFiles = [
  'src/interceptors/http-patcher.node-test.mjs',
  'src/interceptors/undici-patcher.node-test.mjs'
];

console.log('Running tests from dist/esm...');

const child = spawn('node', ['--test', ...testFiles], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TEST_FROM_DIST: 'true'
  },
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
