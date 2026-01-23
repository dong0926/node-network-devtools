import { describe, it, expect } from 'vitest';
import { TraceAggregator } from './trace-aggregator.js';
import { type TraceNode, type TraceSession } from './trace-manager.js';

describe('TraceAggregator', () => {
  it('should compress short duration promise chains', () => {
    const rootNode: TraceNode = {
      id: 0,
      name: 'ROOT',
      type: 'ROOT',
      startTime: 1000,
      endTime: 1100,
      duration: 100,
      children: [
        {
          id: 1,
          parentId: 0,
          name: 'ShortPromise',
          type: 'PROMISE',
          startTime: 1010,
          endTime: 1011,
          duration: 1,
          children: [
            {
              id: 2,
              parentId: 1,
              name: 'DeepTask',
              type: 'FS',
              startTime: 1010,
              endTime: 1020,
              duration: 10,
              children: []
            }
          ]
        }
      ]
    };

    const session: TraceSession = {
      requestId: 'test',
      rootNode,
      nodesMap: new Map(),
      nodeCount: 3,
      isTruncated: false
    };

    const aggregated = TraceAggregator.aggregate(session);

    // ShortPromise (id 1) should be removed, and DeepTask (id 2) should be moved up
    expect(aggregated.children.length).toBe(1);
    expect(aggregated.children[0].id).toBe(2);
    expect(aggregated.children[0].parentId).toBe(0);
  });

  it('should discard very short nodes with no children', () => {
    const rootNode: TraceNode = {
      id: 0,
      name: 'ROOT',
      type: 'ROOT',
      startTime: 1000,
      endTime: 1100,
      duration: 100,
      children: [
        {
          id: 1,
          parentId: 0,
          name: 'Noise',
          type: 'PROMISE',
          startTime: 1010,
          endTime: 1011,
          duration: 1,
          children: []
        },
        {
          id: 2,
          parentId: 0,
          name: 'Significant',
          type: 'HTTP',
          startTime: 1020,
          endTime: 1050,
          duration: 30,
          children: []
        }
      ]
    };

    const session: TraceSession = {
      requestId: 'test',
      rootNode,
      nodesMap: new Map(),
      nodeCount: 3,
      isTruncated: false
    };

    // Use default threshold (2ms)
    const aggregated = TraceAggregator.aggregate(session);

    expect(aggregated.children.length).toBe(1);
    expect(aggregated.children[0].name).toBe('Significant');
  });

  it('should NOT compress nodes exceeding threshold', () => {
    const rootNode: TraceNode = {
      id: 0,
      name: 'ROOT',
      type: 'ROOT',
      startTime: 1000,
      endTime: 1100,
      duration: 100,
      children: [
        {
          id: 1,
          parentId: 0,
          name: 'LongPromise',
          type: 'PROMISE',
          startTime: 1010,
          endTime: 1020,
          duration: 10,
          children: []
        }
      ]
    };

    const session: TraceSession = {
      requestId: 'test',
      rootNode,
      nodesMap: new Map(),
      nodeCount: 2,
      isTruncated: false
    };

    const aggregated = TraceAggregator.aggregate(session);

    expect(aggregated.children.length).toBe(1);
    expect(aggregated.children[0].name).toBe('LongPromise');
  });
});
