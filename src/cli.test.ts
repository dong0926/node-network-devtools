/**
 * CLI 功能测试
 * 
 * 此测试验证 CLI 命令的功能，确保：
 * 1. CLI 命令可以执行
 * 2. CLI 功能未受影响（帮助信息、版本信息等）
 * 3. CLI 在构建后仍然可用
 * 
 * **Validates: Requirements 5.4**
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * 辅助函数：执行 CLI 命令并返回输出
 */
function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const cliPath = path.join(rootDir, 'dist/esm/cli.js');
    const child = spawn('node', [cliPath, ...args], {
      cwd: rootDir,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    // 设置超时，避免测试挂起
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: null });
    }, 5000);
  });
}

describe('CLI Functionality', () => {
  describe('CLI File Existence', () => {
    it('should have CLI file in dist/esm', () => {
      const cliPath = path.join(rootDir, 'dist/esm/cli.js');
      expect(fs.existsSync(cliPath), 'dist/esm/cli.js 应该存在').toBe(true);
      
      const stat = fs.statSync(cliPath);
      expect(stat.isFile(), 'dist/esm/cli.js 应该是一个文件').toBe(true);
    });

    it('should have CLI file in dist/cjs', () => {
      const cliPath = path.join(rootDir, 'dist/cjs/cli.js');
      expect(fs.existsSync(cliPath), 'dist/cjs/cli.js 应该存在').toBe(true);
      
      const stat = fs.statSync(cliPath);
      expect(stat.isFile(), 'dist/cjs/cli.js 应该是一个文件').toBe(true);
    });

    it('should have shebang in ESM CLI file', () => {
      const cliPath = path.join(rootDir, 'dist/esm/cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');
      
      // 验证文件以 shebang 开头
      expect(content.startsWith('#!/usr/bin/env node'), 'CLI 文件应该以 shebang 开头').toBe(true);
    });

    it('should have executable permissions on Unix systems', () => {
      // 跳过 Windows 系统
      if (process.platform === 'win32') {
        return;
      }

      const cliPath = path.join(rootDir, 'dist/esm/cli.js');
      const stat = fs.statSync(cliPath);
      
      // 检查文件是否有执行权限（至少对所有者）
      // mode & 0o100 检查所有者执行权限
      const hasExecutePermission = (stat.mode & 0o100) !== 0;
      expect(hasExecutePermission, 'CLI 文件应该有执行权限').toBe(true);
    });
  });

  describe('CLI Help Command', () => {
    it('should display help message with --help flag', async () => {
      const { stdout, exitCode } = await runCLI(['--help']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('node-network-devtools');
      expect(stdout).toContain('用法');
      expect(stdout).toContain('选项');
      expect(stdout).toContain('示例');
    });

    it('should display help message with -h flag', async () => {
      const { stdout, exitCode } = await runCLI(['-h']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('node-network-devtools');
      expect(stdout).toContain('用法');
    });

    it('should include all command options in help', async () => {
      const { stdout } = await runCLI(['--help']);
      
      const expectedOptions = [
        '--help',
        '--version',
        '--inspect-port',
        '--inspect-brk',
        '--gui',
        '--gui-port',
        '--ws-port',
        '--no-open',
      ];

      for (const option of expectedOptions) {
        expect(stdout).toContain(option);
      }
    });

    it('should include environment variables in help', async () => {
      const { stdout } = await runCLI(['--help']);
      
      const expectedEnvVars = [
        'NND_MAX_REQUESTS',
        'NND_MAX_BODY_SIZE',
        'NND_INTERCEPT_HTTP',
        'NND_INTERCEPT_UNDICI',
        'NND_GUI_ENABLED',
      ];

      for (const envVar of expectedEnvVars) {
        expect(stdout).toContain(envVar);
      }
    });
  });

  describe('CLI Version Command', () => {
    it('should display version with --version flag', async () => {
      const { stdout, exitCode } = await runCLI(['--version']);
      
      expect(exitCode).toBe(0);
      // 版本号应该是一个数字格式（例如 0.1.0）
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should display version with -v flag', async () => {
      const { stdout, exitCode } = await runCLI(['-v']);
      
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('CLI Error Handling', () => {
    it('should show error when no script is provided', async () => {
      const { stderr, exitCode } = await runCLI([]);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('错误');
      expect(stderr).toContain('请指定要运行的脚本');
    });

    it('should suggest using --help when no script is provided', async () => {
      const { stderr } = await runCLI([]);
      
      expect(stderr).toContain('--help');
    });
  });

  describe('CLI Package.json Configuration', () => {
    it('should have bin field in package.json', () => {
      const pkgPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      expect(pkg.bin).toBeDefined();
      expect(typeof pkg.bin).toBe('object');
    });

    it('should have node-network-devtools command in bin', () => {
      const pkgPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      expect(pkg.bin['node-network-devtools']).toBeDefined();
      expect(pkg.bin['node-network-devtools']).toContain('dist/esm/cli.js');
    });

    it('should have nnd shorthand command in bin', () => {
      const pkgPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      expect(pkg.bin['nnd']).toBeDefined();
      expect(pkg.bin['nnd']).toContain('dist/esm/cli.js');
    });

    it('should point bin to ESM version', () => {
      const pkgPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      // CLI 应该使用 ESM 版本（因为 Node.js 的 bin 脚本通常使用 ESM）
      expect(pkg.bin['node-network-devtools']).toContain('dist/esm/');
      expect(pkg.bin['nnd']).toContain('dist/esm/');
    });
  });

  describe('CLI Backward Compatibility', () => {
    it('should maintain same command structure after CommonJS support', async () => {
      // 验证 CLI 命令结构没有改变
      const { stdout } = await runCLI(['--help']);
      
      // 验证核心命令选项仍然存在
      expect(stdout).toContain('--help');
      expect(stdout).toContain('--version');
      expect(stdout).toContain('--gui');
      expect(stdout).toContain('--inspect-port');
    });

    it('should have same help output format', async () => {
      const { stdout } = await runCLI(['--help']);
      
      // 验证帮助输出的基本结构
      expect(stdout).toContain('用法:');
      expect(stdout).toContain('选项:');
      expect(stdout).toContain('示例:');
      expect(stdout).toContain('环境变量:');
      expect(stdout).toContain('说明:');
    });
  });

  describe('CLI Module Compatibility', () => {
    it('should work with ESM build', () => {
      const cliPath = path.join(rootDir, 'dist/esm/cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');
      
      // 验证 ESM CLI 包含 import 语句
      expect(content).toMatch(/import\s+.*from/);
    });

    it('should work with CJS build', () => {
      const cliPath = path.join(rootDir, 'dist/cjs/cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');
      
      // 验证 CJS CLI 包含 require 语句
      expect(content).toMatch(/require\(/);
    });

    it('should handle __dirname and __filename correctly in both builds', () => {
      const esmCli = fs.readFileSync(path.join(rootDir, 'dist/esm/cli.js'), 'utf-8');
      const cjsCli = fs.readFileSync(path.join(rootDir, 'dist/cjs/cli.js'), 'utf-8');
      
      // 验证两个版本都处理了 __dirname 和 __filename
      // ESM 版本应该使用 fileURLToPath 和 dirname
      expect(esmCli).toContain('fileURLToPath');
      expect(esmCli).toContain('dirname');
      expect(esmCli).toContain('currentFilename');
      expect(esmCli).toContain('currentDirname');
      
      // CJS 版本应该使用全局的 __filename 和 __dirname
      expect(cjsCli).toContain('currentFilename');
      expect(cjsCli).toContain('currentDirname');
    });
  });

  describe('CLI Dependencies', () => {
    it('should have register.js in the same directory', () => {
      const esmRegister = path.join(rootDir, 'dist/esm/register.js');
      const cjsRegister = path.join(rootDir, 'dist/cjs/register.js');
      
      expect(fs.existsSync(esmRegister), 'ESM register.js 应该存在').toBe(true);
      expect(fs.existsSync(cjsRegister), 'CJS register.js 应该存在').toBe(true);
    });

    it('should reference register.js correctly', () => {
      const cliPath = path.join(rootDir, 'dist/esm/cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');
      
      // CLI 应该引用 register.js
      expect(content).toContain('register.js');
    });
  });

  describe('CLI Source Maps', () => {
    it('should have source map for ESM CLI', () => {
      const sourceMapPath = path.join(rootDir, 'dist/esm/cli.js.map');
      expect(fs.existsSync(sourceMapPath), 'ESM CLI 应该有 source map').toBe(true);
      
      // 验证 source map 是有效的 JSON
      const content = fs.readFileSync(sourceMapPath, 'utf-8');
      let sourceMap;
      expect(() => {
        sourceMap = JSON.parse(content);
      }).not.toThrow();
      
      expect(sourceMap.version).toBeDefined();
      expect(sourceMap.sources).toBeDefined();
    });

    it('should have source map for CJS CLI', () => {
      const sourceMapPath = path.join(rootDir, 'dist/cjs/cli.js.map');
      expect(fs.existsSync(sourceMapPath), 'CJS CLI 应该有 source map').toBe(true);
      
      // 验证 source map 是有效的 JSON
      const content = fs.readFileSync(sourceMapPath, 'utf-8');
      let sourceMap;
      expect(() => {
        sourceMap = JSON.parse(content);
      }).not.toThrow();
      
      expect(sourceMap.version).toBeDefined();
      expect(sourceMap.sources).toBeDefined();
    });
  });
});
