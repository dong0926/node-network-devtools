/**
 * Fetch API 示例
 * 
 * 演示如何使用 node-network-devtools 监听 fetch API 的请求
 * 
 * 运行方式：
 *   npx node-network-devtools index.js
 */

console.log('Fetch API 示例');
console.log('打开 chrome://inspect 查看网络请求\n');

async function main() {
  // 请求 1: 简单 GET 请求
  console.log('发起 GET 请求...');
  const res1 = await fetch('https://jsonplaceholder.typicode.com/posts/1');
  const post = await res1.json();
  console.log(`✓ GET /posts/1 -> ${res1.status} - "${post.title.slice(0, 30)}..."`);

  // 请求 2: POST 请求
  console.log('\n发起 POST 请求...');
  const res2 = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer my-secret-token',
    },
    body: JSON.stringify({
      title: 'Hello World',
      body: 'This is a test post',
      userId: 1,
    }),
  });
  const newPost = await res2.json();
  console.log(`✓ POST /posts -> ${res2.status} - id: ${newPost.id}`);

  // 请求 3: 并发请求
  console.log('\n发起并发请求...');
  const [users, comments] = await Promise.all([
    fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json()),
    fetch('https://jsonplaceholder.typicode.com/comments?postId=1').then(r => r.json()),
  ]);
  console.log(`✓ 获取 ${users.length} 个用户, ${comments.length} 条评论`);

  console.log('\n所有请求完成！查看 Chrome DevTools Network 面板');
}

main().catch(console.error);
