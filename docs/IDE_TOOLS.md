# IDE Tools Documentation

This project includes optional IDE enhancement tools that improve the development experience. These are completely optional and the project works perfectly without them.

---

## Overview

The AI Starter Kit includes configuration for:
- **Claude AI** (`.claude/` directory)
- **Cursor IDE** (`.cursor/` directory)
- **MCP Servers** (`.mcp.json`)

These tools are kept in the repository to enhance developer productivity but can be safely ignored if you don't use them.

---

## Claude AI Configuration

### Location
`.claude/` directory

### What It Does
Provides context and instructions to Claude AI assistants (like Claude Code) when working on this project.

### Key Files
- `.claude/settings.local.json` - Claude-specific settings
- `CLAUDE.md` - Project instructions for Claude

### Should You Use It?
**Use if:** You're using Claude Code or similar AI coding assistants

**Skip if:** You prefer working without AI assistance

---

## Cursor IDE Configuration

### Location
`.cursor/` directory

### What It Does
Provides code rules and patterns specific to this project for the Cursor IDE.

### Key Files
- `.cursor/rules/convex_rules.mdc` - Convex best practices and patterns

### Should You Use It?
**Use if:** You're using Cursor IDE

**Skip if:** You're using VS Code, WebStorm, or another editor

---

## MCP Servers (Model Context Protocol)

### Location
`.mcp.json`

### What It Does
Configures various development tool servers that can be used by AI assistants:
- **n8n MCP server** - Automation tool integration
- **Convex MCP server** - Convex development helpers
- **Chrome DevTools** - Browser debugging integration
- **Next.js MCP** - Next.js specific tooling

### Should You Use It?
**Use if:** You're using Claude Code or other MCP-compatible tools

**Skip if:** You don't use MCP-enabled tools

---

## Benefits of These Tools

### If You Use Them
- **Faster development** - AI assistants understand project structure
- **Consistent patterns** - Enforces best practices automatically
- **Context-aware help** - Better suggestions based on project setup

### If You Don't Use Them
- **No impact** - Project works identically
- **Smaller git clone** - Slightly less to download (minimal)
- **No maintenance** - One less thing to worry about

---

## Removing These Tools

If you want to clean up the repository:

```bash
# Remove all IDE-specific files
rm -rf .claude
rm -rf .cursor
rm .mcp.json

# Update .gitignore to ignore them in future
echo ".claude/" >> .gitignore
echo ".cursor/" >> .gitignore
echo ".mcp.json" >> .gitignore
```

---

## Adding Your Own IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### WebStorm Configuration

WebStorm auto-detects Next.js and TypeScript configuration.

---

## Recommended VS Code Extensions

If you're using VS Code, install these extensions:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
```

Or manually install:
- **ESLint** - Code linting
- **Tailwind CSS IntelliSense** - Tailwind class autocomplete
- **Prettier** - Code formatting

---

## Summary

These IDE tools are **optional enhancements** that don't affect the core functionality of the starter kit. Use them if they improve your workflow, ignore them if they don't.

The project is designed to work great with or without them!

---

**Previous:** [← Troubleshooting](./TROUBLESHOOTING.md) | **Back to README** [→](../README.md)
