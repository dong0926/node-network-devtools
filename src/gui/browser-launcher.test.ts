/**
 * 浏览器启动器单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createBrowserLauncher,
  resetBrowserLauncher,
  buildGUIUrl,
  buildLaunchArgs,
  createUserDataDir,
  BrowserNotFoundError,
  BrowserLaunchError,
  type IBrowserLauncher,
} from './browser-launcher.js';
import { resetConfig } from '../config.js';
import { tmpdir } from 'os';

describe('BrowserLauncher', () => {
  let launcher: IBrowserLauncher;

  beforeEach(() => {
    resetConfig();
    launcher = createBrowserLauncher();
  });

  afterEach(async () => {
    await launcher.close();
    await resetBrowserLauncher();
    resetConfig();
  });

  describe('生命周期', () => {
    it('初始状态应该是未打开', () => {
      expect(launcher.isOpen()).toBe(false);
    });

    it('关闭后状态应该是未打开', async () => {
      await launcher.close();
      expect(launcher.isOpen()).toBe(false);
    });

    it('重复关闭应该是安全的', async () => {
      await launcher.close();
      await launcher.close(); // 不应该抛出错误
      expect(launcher.isOpen()).toBe(false);
    });
  });
});

describe('buildLaunchArgs', () => {
  it('应该生成正确的启动参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    expect(args).toContain('--app=http://localhost:9230');
    expect(args).toContain('--window-size=800,600');
    expect(args).toContain('--no-sandbox');
    expect(args).toContain('--disable-setuid-sandbox');
  });

  it('应该支持自定义窗口大小', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 1024, height: 768, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    expect(args).toContain('--window-size=1024,768');
  });

  it('应该包含所有必需的优化参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    // 检查关键优化参数
    expect(args).toContain('--disable-extensions');
    expect(args).toContain('--disable-background-networking');
    expect(args).toContain('--mute-audio');
    expect(args).toContain('--no-first-run');
    expect(args).toContain('--no-default-browser-check');
    expect(args).toContain('--disable-sync');
  });

  it('应该包含 --app 参数在第一位', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    expect(args[0]).toBe('--app=http://localhost:9230');
  });

  it('应该包含 --window-size 参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 1280, height: 800, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    expect(args).toContain('--window-size=1280,800');
  });

  it('应该在提供 userDataDir 时包含该参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
      userDataDir: '/tmp/nnd-browser-test123',
    };
    const args = buildLaunchArgs(options);

    expect(args).toContain('--user-data-dir=/tmp/nnd-browser-test123');
  });

  it('应该在未提供 userDataDir 时不包含该参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    const userDataDirArgs = args.filter(arg => arg.startsWith('--user-data-dir='));
    expect(userDataDirArgs).toHaveLength(0);
  });

  it('应该包含所有性能优化参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    // 性能优化参数
    expect(args).toContain('--disable-backgrounding-occluded-windows');
    expect(args).toContain('--disable-renderer-backgrounding');
    expect(args).toContain('--disable-background-timer-throttling');
  });

  it('应该包含所有安全相关参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    // 安全相关参数
    expect(args).toContain('--no-sandbox');
    expect(args).toContain('--disable-setuid-sandbox');
  });

  it('应该包含 UI 优化参数', () => {
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
    };
    const args = buildLaunchArgs(options);

    // UI 优化参数
    expect(args).toContain('--disable-features=TranslateUI');
    expect(args).toContain('--disable-component-extensions-with-background-pages');
    expect(args).toContain('--disable-default-apps');
    expect(args).toContain('--mute-audio');
  });
});

describe('buildGUIUrl', () => {
  it('应该构建正确格式的 URL', () => {
    const url = buildGUIUrl('127.0.0.1', 9230, 9231);
    expect(url).toBe('http://127.0.0.1:9230?wsPort=9231');
  });

  it('应该支持 localhost', () => {
    const url = buildGUIUrl('localhost', 8080, 8081);
    expect(url).toBe('http://localhost:8080?wsPort=8081');
  });

  it('应该支持自定义端口', () => {
    const url = buildGUIUrl('127.0.0.1', 3000, 3001);
    expect(url).toBe('http://127.0.0.1:3000?wsPort=3001');
  });
});

describe('错误类型', () => {
  describe('BrowserNotFoundError', () => {
    it('应该创建正确的错误实例', () => {
      const error = new BrowserNotFoundError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BrowserNotFoundError);
      expect(error.name).toBe('BrowserNotFoundError');
      expect(error.message).toBe('未检测到已安装的浏览器');
    });

    it('应该保持正确的原型链', () => {
      const error = new BrowserNotFoundError();
      
      // 验证 instanceof 检查正常工作
      expect(error instanceof BrowserNotFoundError).toBe(true);
      expect(error instanceof Error).toBe(true);
      
      // 验证原型链
      expect(Object.getPrototypeOf(error)).toBe(BrowserNotFoundError.prototype);
    });

    it('应该可以被 try-catch 捕获', () => {
      expect(() => {
        throw new BrowserNotFoundError();
      }).toThrow(BrowserNotFoundError);
      
      expect(() => {
        throw new BrowserNotFoundError();
      }).toThrow('未检测到已安装的浏览器');
    });
  });

  describe('BrowserLaunchError', () => {
    it('应该创建正确的错误实例（不带 cause）', () => {
      const error = new BrowserLaunchError('启动失败');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BrowserLaunchError);
      expect(error.name).toBe('BrowserLaunchError');
      expect(error.message).toBe('启动失败');
      expect(error.cause).toBeUndefined();
    });

    it('应该创建正确的错误实例（带 cause）', () => {
      const originalError = new Error('原始错误');
      const error = new BrowserLaunchError('启动失败', originalError);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BrowserLaunchError);
      expect(error.name).toBe('BrowserLaunchError');
      expect(error.message).toBe('启动失败');
      expect(error.cause).toBe(originalError);
      expect(error.cause?.message).toBe('原始错误');
    });

    it('应该保持正确的原型链', () => {
      const error = new BrowserLaunchError('启动失败');
      
      // 验证 instanceof 检查正常工作
      expect(error instanceof BrowserLaunchError).toBe(true);
      expect(error instanceof Error).toBe(true);
      
      // 验证原型链
      expect(Object.getPrototypeOf(error)).toBe(BrowserLaunchError.prototype);
    });

    it('应该可以被 try-catch 捕获', () => {
      expect(() => {
        throw new BrowserLaunchError('启动失败');
      }).toThrow(BrowserLaunchError);
      
      expect(() => {
        throw new BrowserLaunchError('启动失败');
      }).toThrow('启动失败');
    });

    it('应该支持自定义错误消息', () => {
      const error1 = new BrowserLaunchError('权限不足');
      const error2 = new BrowserLaunchError('浏览器路径无效');
      const error3 = new BrowserLaunchError('系统资源不足');
      
      expect(error1.message).toBe('权限不足');
      expect(error2.message).toBe('浏览器路径无效');
      expect(error3.message).toBe('系统资源不足');
    });

    it('应该正确保存原始错误信息', () => {
      const spawnError = new Error('ENOENT: no such file or directory');
      spawnError.name = 'SpawnError';
      
      const error = new BrowserLaunchError('无法启动浏览器', spawnError);
      
      expect(error.cause).toBe(spawnError);
      expect(error.cause?.name).toBe('SpawnError');
      expect(error.cause?.message).toBe('ENOENT: no such file or directory');
    });
  });

  describe('错误类型区分', () => {
    it('BrowserNotFoundError 和 BrowserLaunchError 应该是不同的类型', () => {
      const notFoundError = new BrowserNotFoundError();
      const launchError = new BrowserLaunchError('启动失败');
      
      expect(notFoundError).toBeInstanceOf(BrowserNotFoundError);
      expect(notFoundError).not.toBeInstanceOf(BrowserLaunchError);
      
      expect(launchError).toBeInstanceOf(BrowserLaunchError);
      expect(launchError).not.toBeInstanceOf(BrowserNotFoundError);
    });

    it('应该可以通过 instanceof 区分错误类型', () => {
      const errors = [
        new BrowserNotFoundError(),
        new BrowserLaunchError('启动失败'),
        new Error('普通错误'),
      ];
      
      const notFoundErrors = errors.filter(e => e instanceof BrowserNotFoundError);
      const launchErrors = errors.filter(e => e instanceof BrowserLaunchError);
      const genericErrors = errors.filter(e => !(e instanceof BrowserNotFoundError) && !(e instanceof BrowserLaunchError));
      
      expect(notFoundErrors).toHaveLength(1);
      expect(launchErrors).toHaveLength(1);
      expect(genericErrors).toHaveLength(1);
    });
  });
});

describe('错误处理', () => {
  describe('BrowserLaunchError 错误处理', () => {
    it('错误消息应该包含错误原因', () => {
      const testError = new Error('ENOENT: no such file or directory');
      const launchError = new BrowserLaunchError('无法启动浏览器', testError);
      
      // 验证错误信息被正确保存（需求 6.4）
      expect(launchError.message).toBe('无法启动浏览器');
      expect(launchError.cause).toBe(testError);
      expect(launchError.cause?.message).toBe('ENOENT: no such file or directory');
    });

    it('应该支持携带原始错误信息', () => {
      // 验证 BrowserLaunchError 可以携带足够的信息用于友好提示（需求 6.5）
      const testError = new Error('权限不足');
      const launchError = new BrowserLaunchError('浏览器启动失败', testError);
      
      expect(launchError.message).toContain('浏览器启动失败');
      expect(launchError.cause?.message).toContain('权限不足');
    });

    it('应该捕获各种 spawn 异常', () => {
      // 测试各种可能的 spawn 错误（需求 6.4）
      const errors = [
        new Error('ENOENT: no such file or directory'),
        new Error('EACCES: permission denied'),
        new Error('EMFILE: too many open files'),
      ];
      
      errors.forEach(originalError => {
        const launchError = new BrowserLaunchError(
          `无法启动浏览器: ${originalError.message}`,
          originalError
        );
        
        expect(launchError).toBeInstanceOf(BrowserLaunchError);
        expect(launchError.cause).toBe(originalError);
      });
    });
  });
});

describe('createUserDataDir', () => {
  it('应该生成正确格式的用户数据目录路径', () => {
    const userDataDir = createUserDataDir();
    const expectedPrefix = tmpdir();
    
    // 验证路径以系统临时目录开头
    expect(userDataDir).toContain(expectedPrefix);
    
    // 验证路径包含 nnd-browser 前缀
    expect(userDataDir).toContain('nnd-browser-');
  });

  it('应该生成唯一的目录路径', () => {
    const dir1 = createUserDataDir();
    const dir2 = createUserDataDir();
    const dir3 = createUserDataDir();
    
    // 验证每次生成的路径都不同
    expect(dir1).not.toBe(dir2);
    expect(dir2).not.toBe(dir3);
    expect(dir1).not.toBe(dir3);
  });

  it('应该生成包含 8 位 session ID 的路径', () => {
    const userDataDir = createUserDataDir();
    
    // 提取 session ID 部分
    const match = userDataDir.match(/nnd-browser-([a-zA-Z0-9_-]{8})$/);
    
    expect(match).not.toBeNull();
    expect(match?.[1]).toHaveLength(8);
  });

  it('多次调用应该生成不同的 session ID', () => {
    const sessionIds = new Set<string>();
    
    // 生成 10 个目录路径
    for (let i = 0; i < 10; i++) {
      const userDataDir = createUserDataDir();
      const match = userDataDir.match(/nnd-browser-([a-zA-Z0-9_-]+)$/);
      if (match) {
        sessionIds.add(match[1]);
      }
    }
    
    // 验证所有 session ID 都不同
    expect(sessionIds.size).toBe(10);
  });

  it('应该使用系统临时目录作为基础路径', () => {
    const userDataDir = createUserDataDir();
    const systemTmpDir = tmpdir();
    
    // 验证路径以系统临时目录开头
    expect(userDataDir.startsWith(systemTmpDir)).toBe(true);
  });

  it('生成的路径应该可以用于 buildLaunchArgs', () => {
    const userDataDir = createUserDataDir();
    const options = {
      url: 'http://localhost:9230',
      windowConfig: { width: 800, height: 600, title: 'Test' },
      userDataDir,
    };
    
    const args = buildLaunchArgs(options);
    
    // 验证参数中包含生成的用户数据目录
    expect(args).toContain(`--user-data-dir=${userDataDir}`);
  });

  it('应该生成符合文件系统命名规范的路径', () => {
    const userDataDir = createUserDataDir();
    
    // 提取目录名部分（不包括完整路径）
    const dirName = userDataDir.split(/[/\\]/).pop() || '';
    
    // 验证目录名不包含非法字符（Windows 和 Unix 都不允许的字符）
    // 注意：这里只检查目录名，不检查完整路径（因为 Windows 路径包含合法的冒号）
    const illegalChars = /[<>:"|?*\x00-\x1F]/;
    expect(dirName).not.toMatch(illegalChars);
    
    // 验证目录名格式正确
    expect(dirName).toMatch(/^nnd-browser-[a-zA-Z0-9_-]+$/);
  });
});
