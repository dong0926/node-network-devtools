# Contributing to Node Network DevTools

Thank you for your interest in contributing to Node Network DevTools! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/dong0926/node-network-devtools.git
   cd node-network-devtools
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build the project:
   ```bash
   pnpm build
   ```

5. Run tests:
   ```bash
   pnpm test:all
   ```

## 📝 Development Workflow

### Project Structure

```
node-network-devtools/
├── src/                    # Source code
│   ├── interceptors/       # HTTP and Undici interceptors
│   ├── gui/                # GUI server and WebSocket
│   ├── store/              # Request storage
│   ├── context/            # Context management
│   ├── cdp/                # Chrome DevTools Protocol bridge
│   └── adapters/           # Framework adapters (Next.js, etc.)
├── packages/gui/           # Web GUI frontend
├── examples/               # Usage examples
├── dist/                   # Build output
└── templates/              # Template files
```

### Building

```bash
# Build everything
pnpm build

# Build specific parts
pnpm build:esm      # Build ESM modules
pnpm build:types    # Generate TypeScript types
pnpm build:gui      # Build Web GUI
```

### Testing

```bash
# Run all tests
pnpm test:all

# Run unit tests
pnpm test

# Run HTTP interceptor tests
pnpm test:http

# Run Undici interceptor tests
pnpm test:undici

# Watch mode
pnpm test:watch
```

### Development GUI

```bash
cd packages/gui
pnpm dev
```

This starts the Vite dev server with hot reload.

## 🐛 Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. ...
2. ...

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Node.js version: [e.g., 20.10.0]
- Package version: [e.g., 0.1.0]

**Additional context**
Any other context about the problem.
```

## 💡 Suggesting Features

Feature requests are welcome! Please provide:

1. **Use case**: Describe the problem you're trying to solve
2. **Proposed solution**: How you think it should work
3. **Alternatives**: Other solutions you've considered
4. **Additional context**: Any other relevant information

## 🔧 Pull Requests

### Before Submitting

1. Ensure all tests pass: `pnpm test:all`
2. Update documentation if needed
3. Add tests for new features
4. Follow the existing code style
5. Update CHANGELOG.md

### PR Guidelines

1. **One feature per PR**: Keep PRs focused on a single feature or bug fix
2. **Clear description**: Explain what changes you made and why
3. **Link issues**: Reference related issues using `#issue-number`
4. **Update tests**: Add or update tests as needed
5. **Documentation**: Update README or docs if needed

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(interceptor): add support for HTTP/2
fix(gui): resolve WebSocket connection issue
docs(readme): update installation instructions
```

## 📚 Code Style

### TypeScript

- Use TypeScript for all new code
- Provide type definitions for public APIs
- Avoid `any` types when possible
- Use meaningful variable and function names

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters

### Comments

- Write clear, concise comments
- Document complex logic
- Use JSDoc for public APIs

Example:
```typescript
/**
 * Install HTTP and Undici interceptors
 * 
 * @returns Promise that resolves when installation is complete
 * @throws Error if interceptors are already installed
 */
export async function install(): Promise<void> {
  // Implementation
}
```

## 🧪 Testing Guidelines

### Unit Tests

- Test individual functions and modules
- Use descriptive test names
- Cover edge cases and error conditions
- Mock external dependencies

Example:
```typescript
describe('HttpPatcher', () => {
  it('should intercept HTTP requests', async () => {
    // Test implementation
  });

  it('should handle errors gracefully', async () => {
    // Test implementation
  });
});
```

### Property-Based Tests

- Use fast-check for property-based testing
- Test invariants and properties
- Generate diverse test cases

Example:
```typescript
import fc from 'fast-check';

it('should maintain request order', () => {
  fc.assert(
    fc.property(fc.array(fc.string()), (urls) => {
      // Property test implementation
    })
  );
});
```

## 📖 Documentation

### README Updates

- Keep README.md and README.zh-CN.md in sync
- Update examples when adding features
- Include code snippets for new APIs

### API Documentation

- Document all public APIs
- Include usage examples
- Specify parameter types and return values
- Note any breaking changes

### Examples

- Add examples for new features
- Keep examples simple and focused
- Include comments explaining key concepts

## 🔍 Code Review Process

1. **Automated checks**: CI must pass (tests, linting, build)
2. **Manual review**: Maintainers will review your code
3. **Feedback**: Address review comments
4. **Approval**: At least one maintainer approval required
5. **Merge**: Maintainers will merge approved PRs

## 📋 Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Push to GitHub
5. Publish to npm

## 🤝 Community

- Be respectful and inclusive
- Help others in discussions
- Share your use cases and feedback
- Contribute to documentation

## 📞 Getting Help

- 💬 [GitHub Discussions](https://github.com/dong0926/node-network-devtools/discussions)
- 🐛 [Issue Tracker](https://github.com/dong0926/node-network-devtools/issues)
- 📧 Email: your.email@example.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Node Network DevTools! 🎉
