# Remove Chrome DevTools Integration References

## Goal
Update the documentation and code comments to accurately reflect that the tool no longer supports direct Chrome DevTools (CDP) integration, focusing solely on the built-in Web GUI.

## Changes
- Remove "Chrome DevTools Integration" sections from `README.md` and `README.zh-CN.md`.
- Update project descriptions in `package.json`, `README.md`, `README.zh-CN.md`, and `src/index.ts`.
- Clean up references in `docs/PROJECT_STRUCTURE.md` and `CONTRIBUTING.md`.
- Ensure screenshots related to Chrome DevTools integration are removed or updated to emphasize the Web GUI.

## Why
The project migrated away from CDP integration to simplify the architecture and improve stability. Keeping these references is misleading for users who might expect `chrome://inspect` to work with this tool.
