/**
 * JSONViewer 组件使用示例
 * 
 * 此文件展示了 JSONViewer 组件的各种使用场景
 */

import { JSONViewer } from './JSONViewer';

// 示例 1：简单对象
export function Example1() {
  const data = {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com'
  };

  return <JSONViewer data={data} />;
}

// 示例 2：嵌套对象
export function Example2() {
  const data = {
    user: {
      name: 'John Doe',
      address: {
        city: 'New York',
        country: 'USA',
        zipCode: '10001'
      }
    },
    settings: {
      theme: 'dark',
      notifications: true
    }
  };

  return <JSONViewer data={data} />;
}

// 示例 3：数组
export function Example3() {
  const data = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];

  return <JSONViewer data={data} />;
}

// 示例 4：JSON 字符串
export function Example4() {
  const jsonString = '{"name":"John","age":30,"active":true}';

  return <JSONViewer data={jsonString} />;
}

// 示例 5：自定义展开层级
export function Example5() {
  const data = {
    level1: {
      level2: {
        level3: {
          value: 'deep nested value'
        }
      }
    }
  };

  // 展开前两层
  return <JSONViewer data={data} defaultExpandLevel={2} />;
}

// 示例 6：显示根节点
export function Example6() {
  const data = {
    name: 'test',
    value: 123
  };

  return <JSONViewer data={data} showRoot={true} />;
}

// 示例 7：各种数据类型
export function Example7() {
  const data = {
    string: 'Hello World',
    number: 42,
    boolean: true,
    nullValue: null,
    array: [1, 2, 3],
    object: { nested: 'value' }
  };

  return <JSONViewer data={data} />;
}

// 示例 8：空数据
export function Example8() {
  return (
    <div>
      <h3>Null</h3>
      <JSONViewer data={null} />
      
      <h3>Undefined</h3>
      <JSONViewer data={undefined} />
      
      <h3>Empty Object</h3>
      <JSONViewer data={{}} />
      
      <h3>Empty Array</h3>
      <JSONViewer data={[]} />
    </div>
  );
}
