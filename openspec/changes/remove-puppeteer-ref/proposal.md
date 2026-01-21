# Remove Puppeteer References from Documentation

## Goal
Update the documentation to reflect that the tool no longer depends on Puppeteer for launching the GUI.

## Changes
- Remove `puppeteer` from installation instructions in `README.md` and `README.zh-CN.md`.
- Update feature descriptions to mention "Native Browser Launching" instead of "Puppeteer-powered".
- Clarify that it uses the system's existing browser (Chrome/Edge/Chromium).

## Why
The project has migrated to a native browser detection and launching mechanism to reduce dependency overhead and simplify installation. Keeping Puppeteer in the README is misleading and causes unnecessary installation steps for users.
