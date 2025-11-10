# Contributing to AI Starter Kit

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/robertguss/ai-starter-kit/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check [Roadmap](./ROADMAP.md) to see if it's already planned
2. Open a new issue with:
   - Clear use case and motivation
   - Proposed implementation (if any)
   - Examples from other projects

### Improving Documentation

Documentation improvements are always welcome! You can:
- Fix typos or clarify existing docs
- Add missing documentation
- Improve examples and code samples
- Translate documentation (future)

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/ai-starter-kit.git
cd ai-starter-kit
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Convex

```bash
npx convex dev
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
npx convex env set SITE_URL http://localhost:3000
```

### 4. Start Development

```bash
pnpm run dev
```

### 5. Run Tests

```bash
npx convex codegen
pnpm run test
```

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types when possible
- Use strict mode
- Export types for reusable components

### Code Style

- Use ESLint configuration provided
- Format code with Prettier (if configured)
- Use meaningful variable names
- Add comments for complex logic

### Convex Functions

- Always use argument and return validators
- Use descriptive function names
- Add comments explaining complex queries
- Follow patterns in `convex/myFunctions.ts`

Example:
```typescript
export const getTodos = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("todos"),
    text: v.string(),
  })),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

### React Components

- Use functional components with hooks
- Prefer named exports
- Extract complex logic to custom hooks
- Use TypeScript interfaces for props

Example:
```typescript
interface TodoCardProps {
  text: string;
  onComplete: () => void;
}

export function TodoCard({ text, onComplete }: TodoCardProps) {
  // Implementation
}
```

---

## Commit Guidelines

### Commit Message Format

```
<type>: <subject>

<body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add todo list component

Add a reusable todo list component with filtering and sorting capabilities.
Includes tests and documentation.
```

```
fix: resolve authentication redirect loop

Fixed issue where users would get stuck in redirect loop when accessing
protected routes. Updated middleware logic to properly handle session validation.

Closes #123
```

---

## Pull Request Process

### Before Submitting

1. **Update your fork**
   ```bash
   git remote add upstream https://github.com/robertguss/ai-starter-kit.git
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   pnpm run lint
   pnpm run test:once
   pnpm run build
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/my-feature
   ```

### Creating the Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template with:
   - **Description**: What does this PR do?
   - **Motivation**: Why is this change needed?
   - **Testing**: How was it tested?
   - **Screenshots**: If applicable
   - **Breaking changes**: If any

### PR Review Process

1. **Automated checks** must pass:
   - Build succeeds
   - Tests pass
   - Lint passes

2. **Code review** by maintainers:
   - Code quality and style
   - Functionality correctness
   - Documentation completeness

3. **Feedback addressed**:
   - Respond to comments
   - Make requested changes
   - Request re-review

4. **Merge**:
   - Squash and merge (default)
   - Maintainer merges when approved

---

## Development Workflow

### Adding a New Feature

1. Check [Roadmap](./ROADMAP.md) and open issues
2. Create an issue to discuss the feature
3. Wait for maintainer approval
4. Fork and create a feature branch
5. Implement the feature
6. Add tests
7. Update documentation
8. Submit PR

### Fixing a Bug

1. Check if bug is already reported
2. Create a bug report if needed
3. Fork and create a fix branch
4. Implement the fix
5. Add test to prevent regression
6. Submit PR

---

## Testing Guidelines

### Writing Tests

- Place tests in `convex/*.test.ts`
- Use descriptive test names
- Test both success and error cases
- Follow patterns in existing tests

Example:
```typescript
describe("todos", () => {
  it("should create a new todo", async () => {
    const t = convexTest(schema, modules);
    const todoId = await t.mutation(api.todos.create, {
      text: "Test todo",
    });
    expect(todoId).toBeDefined();
  });

  it("should throw error for empty text", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.todos.create, { text: "" })
    ).rejects.toThrow();
  });
});
```

---

## Questions?

- Open a [Discussion](https://github.com/robertguss/ai-starter-kit/discussions)
- Ask in an issue
- Review existing documentation

Thank you for contributing! 🎉
