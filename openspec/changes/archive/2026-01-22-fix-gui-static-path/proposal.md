# Proposal: Fix GUI Static Path Resolution

## Problem Statement
The GUI server fails to locate `index.html` and other static files when the package is used in certain environments (e.g., Next.js, or when bundled). The current path resolution logic relies on `currentDirname` (which defaults to `process.cwd()` if `import.meta.url` or `__dirname` fails) and a set of hardcoded relative paths that do not cover all usage scenarios.

Specifically, the user reported an `ENOENT` error where the server looked for `index.html` in their project's root `gui/` directory instead of the package's `dist/gui/` directory.

## Proposed Changes
1. **Enhance `currentDirname` detection**: Implement a more robust fallback mechanism for determining the module's directory.
2. **Robust `staticDir` search**:
   - Try to locate the package directory using `require.resolve` if available.
   - Search for `node_modules/@mt0926/node-network-devtools/dist/gui`.
   - Support an environment variable `NND_GUI_DIR` for manual override.
   - Improve the search order and add more diagnostic logs.
3. **Graceful Error Handling**: Provide a clearer error message with instructions on how to fix it (e.g., setting the environment variable) when the GUI files cannot be found.

## Impact
- **Fixes**: GUI not loading in some production or bundled environments.
- **User Experience**: Better error messages and manual override capability.
- **Maintainability**: More robust path handling across different Node.js environments.
