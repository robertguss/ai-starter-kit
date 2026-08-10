# AI Starter Kit

A modern, production-ready starter kit for building full-stack applications with **TanStack Start**, **Convex** real-time database, **Clerk** authentication, **TypeScript**, and **shadcn/ui** components.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-latest-black.svg)](https://tanstack.com/start/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Quickstart

From a fresh clone to a running app with Convex + Clerk auth. This kit uses
[aube](https://aube.jdx.dev) (`aube` / `aubr` / `aubx`), not npm/pnpm scripts
directly.

### Prerequisites

| Tool | Requirement |
| --- | --- |
| Node.js | **20.9+** (`node -v`) |
| aube | Install from [aube.jdx.dev](https://aube.jdx.dev) (`aube --version`) |
| Accounts | Free [Clerk](https://clerk.com) + [Convex](https://convex.dev) (CLI opens a browser) |

Windows: use Git Bash or WSL for the shell scripts below.

### 1. Clone and install

```bash
git clone https://github.com/robertguss/web-app-starter-kit.git
cd web-app-starter-kit
aube install
```

### 2. Log in to the Clerk CLI (once per machine)

```bash
aubx clerk@latest auth login
aubx clerk@latest whoami
```

Do this in a normal terminal with a browser. Do **not** run `clerk init` in
this repo. Providers, middleware, `/login`, and `/signup` already ship with
the kit.

### 3. Link Convex

```bash
aubx convex dev --until-success
```

Log in / create a Convex project when prompted. This writes
`VITE_CONVEX_URL` into `.env.local` (and `setup.sh` maps any legacy
`NEXT_PUBLIC_CONVEX_URL` if needed).

### 4. Finish Clerk + Convex JWT auth

```bash
./scripts/setup-clerk-auth.sh
# same as: aubr setup:clerk
```

This idempotent script:

1. Adds kit route defaults (`/login`, `/signup` → `/dashboard`) to `.env.local`
2. Creates or links a Clerk app and runs `clerk env pull`
3. Creates the Clerk JWT template named `convex` when missing
4. Sets `CLERK_JWT_ISSUER_DOMAIN` on your Convex deployment

### 5. Start the app

```bash
aubr dev
```

Runs the TanStack Start frontend and Convex backend together
(`package.json` → `dev` / `dev:frontend` / `dev:backend`).

Open [http://localhost:3000](http://localhost:3000).

### 6. Verify auth end to end

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup) and create a user
2. Confirm you land on `/dashboard`
3. Sign out fully, then sign in again at `/login` (needed once after the JWT template is created)
4. Confirm the dashboard still loads while signed in

### One-command path

If the Clerk CLI is already logged in:

```bash
git clone https://github.com/robertguss/web-app-starter-kit.git
cd web-app-starter-kit
./setup.sh
```

`./setup.sh` installs deps, runs Convex until ready, calls
`scripts/setup-clerk-auth.sh`, then starts `aubr dev`.

### Deeper docs

| Topic | Doc |
| --- | --- |
| Auth details + Dashboard fallback | [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md) |
| Full setup / env reference | [docs/SETUP.md](./docs/SETUP.md) |
| Longer quick start + troubleshooting | [docs/QUICK_START.md](./docs/QUICK_START.md) |
| Clerk CLI for agents | [clerk.com/cli/agents.txt](https://clerk.com/cli/agents.txt) |

---

<div align="center">

## 📬 Join the Refactoring AI Newsletter

[![Subscribe](https://img.shields.io/badge/Subscribe-Refactoring%20AI-blue?style=for-the-badge&logo=substack&logoColor=white)](https://refactoringai.substack.com/)

<a href="https://refactoringai.substack.com/">
  <img src="./public/refactoring-ai.webp" alt="Refactoring AI Newsletter" width="600px" />
</a>

<h3>I teach developers how to ship their ideas in days with AI</h3>

<p><strong>Master modern full-stack development with AI-powered tools and techniques</strong></p>

<p><strong>✨ What You'll Learn:</strong></p>

<p>
🚀 I've taught over 50,000 developers to date.<br/>
🎯 Top 1% TypeScript engineers globally on GitHub.<br/>
🤖 Learn how to use AI coding agents like Claude Code effectively
</p>

[**→ Subscribe Now (It's Free!)**](https://refactoringai.substack.com/)

</div>

---

## Built with this Starter Kit

<div align="center">

<h3><a href="https://github.com/robertguss/social_post">SocialPost</a> - Real-World Production Application</h3>

[![GitHub](https://img.shields.io/badge/View_on_GitHub-SocialPost-181717?style=for-the-badge&logo=github)](https://github.com/robertguss/social_post)

<p><strong>See this starter kit in action!</strong> SocialPost is a full-featured social media management tool built entirely with this stack.</p>

[**→ Explore SocialPost Source Code**](https://github.com/robertguss/social_post)

</div>

---

## Table of Contents

- [Quickstart](#quickstart)
- [Features](#features)
- [Recommended Development Workflow](#recommended-development-workflow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Capabilities

- **Authentication** - Clerk + Convex JWT integration
  - Hosted Clerk sign-in / sign-up UI
  - Protected `/dashboard` route via TanStack Router `beforeLoad` + Clerk server auth
  - Convex identity from Clerk JWTs (`ctx.auth.getUserIdentity()`)
  - Setup via Clerk CLI (`./scripts/setup-clerk-auth.sh`); Dashboard fallback in docs

- **Real-time Database** - Powered by Convex
  - Serverless backend with zero infrastructure management
  - Automatic TypeScript generation
  - Real-time subscriptions out of the box
  - ACID transactions

- **Modern UI Components** - 20+ shadcn/ui components pre-installed
  - Buttons, Forms, Modals, Tables, Charts, Sidebar
  - Fully customizable with Tailwind CSS 4
  - Dark mode support with Tailwind CSS variables
  - Responsive design patterns

- **Testing Infrastructure** - Complete testing setup
  - Vitest for unit and integration tests
  - convex-test for isolated backend testing
  - Example tests included
  - Coverage reporting

- **Developer Experience**
  - TypeScript strict mode for type safety
  - ESLint configuration for code quality
  - Hot module replacement
  - Parallel dev servers via `aubr dev` (frontend + backend)

---

## Recommended Development Workflow

### Building with AI Coding Agents

This starter kit is designed to work seamlessly with AI coding agents like **Claude Code**. For the best development experience, we recommend following the **[BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD)** (Breakthrough Method for Agile AI Driven Development).

**What is BMAD?**

The BMAD Method is a comprehensive framework that combines human expertise with AI capabilities to build software more effectively. It provides:

- **19+ specialized AI agents** and **50+ workflows** for different development scenarios
- **Three planning tracks** that automatically adapt based on your project needs:
  - **Quick Flow Track** - Bug fixes and small features
  - **BMad Method Track** - Full products and platforms (recommended for this starter kit)
  - **Enterprise Method Track** - Complex systems with security and compliance needs

**Why BMAD with this Starter Kit?**

- Accelerates feature development while maintaining code quality
- Provides structured workflows for common tasks (auth, database, UI components)
- Helps AI agents understand your project structure and patterns
- Guides reflective thinking that brings out better architectural decisions

**Getting Started with BMAD:**

1. Review the [BMAD Method documentation](https://github.com/bmad-code-org/BMAD-METHOD)
2. Use the `CLAUDE.md` file in this repo (pre-configured for Claude Code)
3. Follow the BMad Method Track for adding new features to your application

> **Note**: While BMAD is recommended, it's entirely optional. This starter kit works great with any development workflow or AI coding assistant.

---

## Tech Stack

| Category            | Technology   | Version | Purpose                              |
| ------------------- | ------------ | ------- | ------------------------------------ |
| **Framework**       | TanStack Start | latest | Full-stack React framework with Vite SSR |
| **Frontend**        | React        | 19.x    | UI library                           |
| **Language**        | TypeScript   | 5.x     | Type-safe JavaScript                 |
| **Backend**         | Convex       | 1.28+   | Real-time serverless database        |
| **Auth**            | Clerk        | Latest  | Authentication & session management  |
| **Styling**         | Tailwind CSS | 4.x     | Utility-first CSS framework          |
| **Components**      | shadcn/ui    | Latest  | Radix UI + Tailwind components       |
| **Icons**           | Lucide React | Latest  | Beautiful consistent icons           |
| **Testing**         | Vitest       | 4.x     | Fast unit testing framework          |
| **Package Manager** | aube         | 1.x+    | Fast, secure JavaScript package manager   |

### Why These Technologies?

- **TanStack Start**: Full-stack React framework with TanStack Router, Vite, SSR, and server functions
- **Convex**: Eliminates the complexity of traditional backends - no REST/GraphQL APIs to build, real-time by default
- **Clerk**: Hosted auth with a first-party Convex JWT integration
- **shadcn/ui**: Copy-paste components you own, built on Radix UI primitives for accessibility
- **TypeScript**: End-to-end type safety from database to frontend

---

## Project Structure

```
ai-starter-kit/
├── app/                          # TanStack Start application source
│   ├── routes/                   # TanStack Router routes
│   │   ├── __root.tsx            # Root route (providers + document shell)
│   │   ├── index.tsx             # Home page
│   │   ├── dashboard.tsx         # Protected dashboard page
│   │   ├── login.tsx             # Clerk sign-in
│   │   └── signup.tsx            # Clerk sign-up
│   ├── router.tsx                # Router factory
│   ├── start.ts                  # TanStack Start entry + Clerk middleware
│   ├── ConvexClientProvider.tsx  # Convex + Clerk provider
│   └── globals.css               # Tailwind CSS entry
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components (20+)
│   ├── app-sidebar.tsx           # Main application sidebar
│   ├── nav-user.tsx              # User menu (Clerk signOut)
│   └── data-table.tsx            # Reusable data table
│
├── convex/                       # Convex backend
│   ├── _generated/               # Auto-generated types & API
│   ├── auth.config.ts            # Clerk JWT provider config
│   ├── auth.ts                   # getCurrentUser helper
│   ├── http.ts                   # HTTP router
│   ├── schema.ts                 # Database schema
│   ├── test.setup.ts             # Test configuration
│   └── TESTING.md                # Testing documentation
│
├── lib/                          # Shared utilities
│   └── utils.ts                  # Helper functions (cn, etc.)
│
├── hooks/                        # React hooks
│   └── use-mobile.ts             # Mobile detection hook
│
├── docs/                         # Documentation
│   ├── AUTHENTICATION.md         # Clerk + Convex auth guide
│   └── ...                       # Setup, architecture, etc.
│
├── vite.config.ts                # Vite + TanStack Start plugin configuration
├── .mcp.json                     # Includes Clerk MCP
├── CLAUDE.md                     # Claude AI development guide
└── LICENSE                       # MIT License
```

---

## Documentation

Comprehensive guides for all aspects of the starter kit:

### Getting Started

- [Quick Start Guide](./docs/QUICK_START.md) - Get running in 5 minutes
- [Detailed Setup](./docs/SETUP.md) - Complete installation & configuration
- [Architecture Overview](./docs/ARCHITECTURE.md) - How everything fits together

### Development

- [Development Guide](./docs/DEVELOPMENT.md) - Adding features, modifying schema
- [API Reference](./docs/API.md) - Convex functions documentation
- [Database Guide](./docs/DATABASE.md) - Schema, indexes, and patterns
- [Authentication](./docs/AUTHENTICATION.md) - Auth flows and customization

### Deployment & Help

- [Deployment Guide](./docs/DEPLOYMENT.md) - Deploy to production (Vercel)
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [IDE Tools](./docs/IDE_TOOLS.md) - Optional development enhancements

---

## Development

### Available Scripts

```bash
# Development
aubr dev               # Run both frontend and backend in parallel
aubr dev:frontend      # Run TanStack Start Vite dev server
aubr dev:backend       # Run Convex only
aubr predev            # Convex dev + auto-open dashboard

# Building
aubr build             # Build for production (Vite + SSR + type check)
aubr start             # Start production Node server

# Code Quality
aubr lint              # Run ESLint

# Testing
aubr test              # Run tests in watch mode
aubr test:once         # Run tests once
aubr test:debug        # Debug tests with inspector
aubr test:coverage     # Run with coverage report
```

### Adding New Features

```bash
# Add a new shadcn/ui component
aubx shadcn@latest add [component-name]

# Generate Convex types (after schema changes)
aubx convex codegen

# Open Convex dashboard
aubx convex dashboard
```

### Environment Variables

Create a `.env.local` file for the Vite frontend. Convex writes
`VITE_CONVEX_URL` (setup.sh ensures this key is present if Convex wrote a legacy name) for the
TanStack Start client.

```bash
# Auto-generated by `aubx convex dev`
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Written by ./scripts/setup-clerk-auth.sh (Clerk CLI)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/signup
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

`./scripts/setup-clerk-auth.sh` also sets `CLERK_JWT_ISSUER_DOMAIN` on Convex.

See [`.env.example`](./.env.example) and [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md).

---

## Testing

This starter includes a complete testing setup with Vitest and convex-test:

```bash
# Run tests in watch mode
aubr test

# Run tests once (CI mode)
aubr test:once

# Run with coverage
aubr test:coverage
```

**Key patterns:**

- Tests run in isolated environment with mock database
- See [convex/TESTING.md](./convex/TESTING.md) for comprehensive testing guide

```typescript
import { convexTest } from "convex-test";
import { modules } from "./test.setup";
import schema from "./schema";

it("should test something", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.myModule.listItems, { count: 10 });
  expect(result).toEqual([]);
});
```

---

## Deployment

### Default Node Server Preset (Recommended for local / self-host)

1. **Push to GitHub**

   ```bash
   git push origin main
   ```

2. **Build the application**

   ```bash
   aubr build
   ```

3. **Deploy Backend**

   ```bash
   aubx convex deploy
   ```

4. **Set Production Environment Variables**

   ```bash
   aubx convex env set CLERK_JWT_ISSUER_DOMAIN https://clerk.your-domain.com --prod
   ```

5. **Start the production Node server**

   ```bash
   aubr start
   ```

This project uses the default TanStack Start Node SSR preset. Vercel, Cloudflare,
and other presets can be added later by adjusting `vite.config.ts` and the
`start` script.

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment
instructions, custom domains, and other platforms.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`aubr test:once`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and enhancements, including:

- OAuth providers (Google, GitHub)
- Email verification flow
- Password reset functionality
- User profile management
- Additional example components
- And more!

---

## Community & Support

- **Issues**: [GitHub Issues](https://github.com/robertguss/ai-starter-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/robertguss/ai-starter-kit/discussions)
- **Contributing**: [Contribution Guidelines](./CONTRIBUTING.md)

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

Built with amazing open-source technologies:

- [TanStack Start](https://tanstack.com/start/) - Full-stack React framework with Vite SSR
- [Convex](https://convex.dev/) - The reactive backend
- [Clerk](https://clerk.com/) - Authentication and user management
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components

---

**Made with ❤️ by [Robert Guss](https://github.com/robertguss)**

If this starter kit helped you, consider giving it a ⭐️ on GitHub!
