import { Suspense } from 'react';
import { createUser, deleteUser } from './actions/user-actions';

// Server Component - 演示带缓存的 fetch 请求
async function UserList() {
  console.log('[Server Component] 正在获取用户列表...');
  
  // 带缓存的请求 - 60秒后重新验证
  const usersRes = await fetch('https://jsonplaceholder.typicode.com/users', {
    next: { 
      revalidate: 60,
      tags: ['users'] 
    }
  });
  
  const users = await usersRes.json();
  
  return (
    <div className="section">
      <h2>👥 用户列表（Server Component）</h2>
      <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
        使用 <code>fetch</code> 获取数据，带 60 秒缓存
      </p>
      <ul className="list">
        {users.slice(0, 5).map((user: any) => (
          <li key={user.id} className="list-item">
            <span>
              <strong>{user.name}</strong> ({user.email})
            </span>
            <span className="badge badge-success">已缓存</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Server Component - 演示不缓存的 fetch 请求
async function PostList() {
  console.log('[Server Component] 正在获取文章列表...');
  
  // 不缓存的请求
  const postsRes = await fetch('https://jsonplaceholder.typicode.com/posts', {
    cache: 'no-store'
  });
  
  const posts = await postsRes.json();
  
  return (
    <div className="section">
      <h2>📝 文章列表（Server Component）</h2>
      <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
        使用 <code>fetch</code> 获取数据，<code>cache: 'no-store'</code>
      </p>
      <ul className="list">
        {posts.slice(0, 5).map((post: any) => (
          <li key={post.id} className="list-item">
            <span>
              <strong>{post.title}</strong>
            </span>
            <span className="badge badge-warning">不缓存</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 主页面
export default function Home() {
  return (
    <div className="container">
      <div className="header">
        <h1>🚀 Next.js + node-network-devtools</h1>
        <p>演示在 Next.js App Router 中监听网络请求</p>
      </div>

      <div className="alert alert-info">
        <strong>💡 提示：</strong> 所有网络请求都会被 node-network-devtools 捕获。
        打开 Chrome DevTools 控制台或使用 Web GUI 查看详细信息。
      </div>

      {/* Server Component 数据获取 */}
      <Suspense fallback={<div className="section">加载用户列表...</div>}>
        <UserList />
      </Suspense>

      <Suspense fallback={<div className="section">加载文章列表...</div>}>
        <PostList />
      </Suspense>

      {/* Server Actions 表单 */}
      <div className="section">
        <h2>✨ Server Actions</h2>
        <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
          提交表单会触发 Server Action，发起 POST 请求
        </p>
        
        <form action={createUser} className="form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">用户名：</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              placeholder="输入用户名"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">邮箱：</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="输入邮箱"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            创建用户
          </button>
        </form>

        <form action={deleteUser} className="form" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label htmlFor="userId" className="form-label">删除用户 ID：</label>
            <input
              type="number"
              id="userId"
              name="userId"
              className="form-input"
              placeholder="输入用户 ID"
              required
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            删除用户
          </button>
        </form>
      </div>

      {/* API Route 说明 */}
      <div className="section">
        <h2>🔌 API Route Handler</h2>
        <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
          访问以下 API 端点查看 Route Handler 中的网络请求：
        </p>
        <div className="code-block">
          <pre>GET  /api/users      - 获取用户列表{'\n'}POST /api/users      - 创建新用户{'\n'}GET  /api/users/[id] - 获取单个用户</pre>
        </div>
        <a href="/api/users" target="_blank" className="btn btn-primary">
          访问 /api/users
        </a>
      </div>

      {/* 使用说明 */}
      <div className="section">
        <h2>📖 查看网络请求</h2>
        
        <h3>方式一：Web GUI（推荐）</h3>
        <p>使用环境变量启动：</p>
        <div className="code-block">
          <pre>NND_GUI_ENABLED=true pnpm dev</pre>
        </div>

        <h3>方式二：Chrome DevTools</h3>
        <ol style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>打开 Chrome 浏览器</li>
          <li>访问 <code>chrome://inspect</code></li>
          <li>在 "Remote Target" 下找到 Next.js 进程</li>
          <li>点击 "inspect" 打开 DevTools</li>
          <li>查看 Console 面板的网络请求日志</li>
        </ol>

        <div className="alert alert-info" style={{ marginTop: '1rem' }}>
          <strong>注意：</strong> Chrome DevTools 的 Network 面板目前还不支持显示 Node.js 网络事件。
          请使用 Console 面板或 Web GUI。
        </div>
      </div>
    </div>
  );
}
