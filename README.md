# AI Starter Kit

A modern, production-ready starter kit for building full-stack applications with **TanStack Start**, **Convex** real-time database, **Clerk** authentication, **TypeScript**, and **shadcn/ui** components.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-latest-black.svg)](https://tanstack.com/start/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

> **Perfect for**: Rapidly prototyping full-stack applications, learning modern web development patterns, or starting your next SaaS project with a solid foundation.

---

## 🚀 Built with this Starter Kit

<div align="center">

<h3><a href="https://github.com/robertguss/social_post">SocialPost</a> - Real-World Production Application</h3>

[![GitHub](https://img.shields.io/badge/View_on_GitHub-SocialPost-181717?style=for-the-badge&logo=github)](https://github.com/robertguss/social_post)

<p><strong>See this starter kit in action!</strong> SocialPost is a full-featured social media management tool built entirely with this stack.</p>

<p><strong>Features:</strong></p>

<p>
📝 Create and schedule posts across multiple social platforms<br/>
📊 Analytics dashboard with real-time engagement metrics<br/>
🎨 Rich media support (images, videos, carousel posts)<br/>
📅 Calendar view for content planning<br/>
🔄 Real-time sync across all your social accounts<br/>
🤖 AI-powered post suggestions and optimization
</p>

[**→ Explore SocialPost Source Code**](https://github.com/robertguss/social_post)

</div>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
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
  - Social providers and MFA configurable in the Clerk Dashboard

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
  - Hot module replacement with Turbo
  - Parallel dev servers (frontend + backend)

---

## Quick Start

Get up and running in **5 minutes**:

### Prerequisites

- **Node.js** 18.x or later
- **pnpm** (recommended) or npm - the setup script will install pnpm if missing

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/robertguss/ai-starter-kit.git
cd ai-starter-kit

# Run the setup script (handles everything!)
./setup.sh
```

The setup script will:

1. Check and install prerequisites (including pnpm if missing)
2. Install all dependencies
3. Guide you through Convex authentication (opens browser)
4. Configure all environment variables automatically
5. Start the development servers

> **Note for Windows users**: Run `bash setup.sh` in Git Bash or WSL.

### Option 2: Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

```bash
# Clone the repository
git clone https://github.com/robertguss/ai-starter-kit.git
cd ai-starter-kit

# Install dependencies
aube install

# Set up Convex (follow the prompts to create/link a project)
aubx convex dev

# Finish Clerk in the Dashboard (required once):
# 1) Create app:      https://dashboard.clerk.com/apps/new
# 2) API keys:        https://dashboard.clerk.com/last-active?path=api-keys
#    → put publishable + secret keys in .env.local (see .env.example)
# 3) Enable Convex:   https://dashboard.clerk.com/apps/setup/convex
#    → copy Frontend API URL, then:
aubx convex env set CLERK_JWT_ISSUER_DOMAIN https://YOUR-APP.clerk.accounts.dev

# Start the development servers (frontend + backend)
aubr dev
```

Full Clerk UI walkthrough: [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md).

</details>

---

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the landing page!

**Next steps:**

1. Finish Clerk Dashboard setup (API keys + Convex integration). See
   [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)
2. Create an account at `/signup`, then open `/dashboard`
3. Add your own Convex functions in the `convex/` directory
4. Read the [Setup Guide](./docs/SETUP.md) for detailed configuration

> **Tip**: See [docs/QUICK_START.md](./docs/QUICK_START.md) for a more detailed quick start guide with troubleshooting.

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
`NEXT_PUBLIC_CONVEX_URL`; setup.sh copies it to `VITE_CONVEX_URL` for the
TanStack Start client.

```bash
# Auto-generated by `aubx convex dev`
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# From Clerk Dashboard → API keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/signup
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

Set the Clerk issuer on Convex:

```bash
aubx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-frontend-api-url
```

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
