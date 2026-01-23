# Design: Robust GUI Static Path Resolution

## Core Logic Improvements

### 1. Module Directory Detection
Instead of just `eval('import.meta.url')` or `__dirname`, we will try multiple strategies:
1. `__dirname` (CommonJS)
2. `import.meta.url` (ESM)
3. `require.resolve('@mt0926/node-network-devtools')` if `require` is available.
4. Searching upwards from `process.cwd()` for `node_modules/@mt0926/node-network-devtools`.

### 2. Static Directory Search Order
The server will look for `index.html` in the following locations (in order):
1. `process.env.NND_GUI_DIR` (Highest priority)
2. `join(packageDir, 'dist/gui')` (Standard installation)
3. `join(packageDir, 'gui')` (Alternative structure)
4. `join(currentDirname, '../../gui')` (Legacy compiled path)
5. `join(currentDirname, '../../../dist/gui')` (Development path)
6. `join(process.cwd(), 'node_modules/@mt0926/node-network-devtools/dist/gui')` (Explicit node_modules search)

### 3. Implementation Details

We will create a helper function `resolveStaticDir` in `src/gui/server.ts` or a utility file.

```typescript
function resolveStaticDir(currentDir: string): string {
  // 1. Env override
  if (process.env.NND_GUI_DIR) {
    return process.env.NND_GUI_DIR;
  }

  const possiblePaths = [
    // ... paths mentioned above ...
  ];

  for (const p of possiblePaths) {
    if (existsSync(p) && existsSync(join(p, 'index.html'))) {
      return p;
    }
  }

  // Final fallback (current behavior)
  return join(currentDir, '../../gui');
}
```

## Diagnostic Logging
When a file is not found, the server should log all the paths it attempted to search, helping users debug their specific environment.

## Environment Variable Support
`NND_GUI_DIR` will allow users to explicitly point to the GUI files if the automatic detection fails in complex setups like monorepos or custom bundlers.
