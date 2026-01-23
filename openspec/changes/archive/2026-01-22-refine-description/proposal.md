# Refine Project Documentation

## Goal
Overhaul the project documentation (`README.md` and `README.zh-CN.md`) to provide a compelling introduction and a streamlined, easy-to-follow usage guide.

## Changes
- **Introduction**: Rewrite to emphasize "Zero-Config", "DevTools-like Experience", and "Universal Support" (HTTP/HTTPS/Fetch/Undici).
- **Usage Section**: Reorder the "Quick Start" guide. Prioritize the **Programmatic Method** (`import { install } ...`) as the primary, most reliable way to integrate. Present the **CLI Method** (`--import` / `-r`) as an advanced/alternative option for zero-code injection.
- **Visuals**: Ensure the flow leads naturally to the screenshots.

## Why
- Programmatic usage is often more explicit, easier to debug, and works reliably across different environments/package managers without worrying about Node.js version flags (like `--import` vs `-r`).
- The CLI method, while powerful, can be tricky depending on how the user's project is structured or executed (e.g., inside complex `npm scripts`).
