# Proposal: Embed GUI Assets and Show Version

## Why
1.  **Path Stability**: In bundled environments like Next.js, physical file paths for static assets often drift or become inaccessible. Embedding assets directly into the JavaScript bundle ensures the GUI always loads regardless of deployment environment.
2.  **Ease of Identification**: Displaying the package version in the GUI helps users confirm which version of the tool they are currently running.

## What Changes
1.  **Asset Generation Script**: Added `scripts/generate-assets.js` to convert `dist/gui` files into a TypeScript module (`src/gui/assets.gen.ts`) containing Base64 encoded content.
2.  **Build Integration**: Updated `package.json` to include asset generation in the build pipeline.
3.  **Memory-based Serving**: Updated `src/gui/server.ts` to serve files from the embedded assets first, falling back to the filesystem only if not found (e.g., in local development).
4.  **Version Display**: Injected the package version into the GUI via Vite's `define` and displayed it in the `Toolbar`.
