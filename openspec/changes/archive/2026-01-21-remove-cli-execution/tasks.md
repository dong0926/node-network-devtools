## 1. Specification Updates
- [x] 1.1 Update `cli-and-registration` spec to remove CLI requirement.

## 2. Code Cleanup
- [x] 2.1 Remove `src/cli.ts`.
- [x] 2.2 Remove `src/cli.test.ts`.
- [x] 2.3 Remove `bin` section from `package.json`.

## 3. Documentation Updates
- [x] 3.1 Update `README.md` to remove CLI usage examples.
- [x] 3.2 Update `README.zh-CN.md` to remove CLI usage examples.
- [x] 3.3 Ensure all examples and guides point to the `register` method.

## 4. Verification
- [x] 4.1 Run `pnpm build` to ensure no broken references.
- [x] 4.2 Run `pnpm test:all` to ensure no regression.
