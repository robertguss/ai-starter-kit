# AI Starter Kit

A modern, production-ready starter kit for building full-stack applications with **Next.js 16**, **Convex** real-time database, **Better Auth** authentication, **TypeScript**, and **shadcn/ui** components.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black.svg)](https://nextjs.org/)
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

- **Authentication** - Complete auth system with Better Auth + Convex integration
  - Email/password authentication (no verification required for quick setup)
  - Protected routes with middleware
  - Session management
  - Ready for OAuth providers (see [Roadmap](./ROADMAP.md))

- **Real-time Database** - Powered by Convex
  - Serverless backend with zero infrastructure management
  - Automatic TypeScript generation
  - Real-time subscriptions out of the box
  - ACID transactions

- **Modern UI Components** - 20+ shadcn/ui components pre-installed
  - Buttons, Forms, Modals, Tables, Charts, Sidebar
  - Fully customizable with Tailwind CSS 4
  - Dark mode support with next-themes
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
pnpm install

# Set up Convex (follow the prompts to create/link a project)
npx convex dev

# In a new terminal, set required environment variables
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
npx convex env set SITE_URL http://localhost:3000

# Add NEXT_PUBLIC_CONVEX_SITE_URL to .env.local (replace with your deployment name)
echo "NEXT_PUBLIC_CONVEX_SITE_URL=https://YOUR-DEPLOYMENT.convex.site" >> .env.local

# Start the development servers (frontend + backend)
pnpm run dev
```

</details>

---

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the landing page!

**Next steps:**

1. Create an account at `/signup`
2. Log in and explore the dashboard
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
| **Framework**       | Next.js      | 16.x    | React framework with App Router      |
| **Frontend**        | React        | 19.x    | UI library                           |
| **Language**        | TypeScript   | 5.x     | Type-safe JavaScript                 |
| **Backend**         | Convex       | 1.28+   | Real-time serverless database        |
| **Auth**            | Better Auth  | 1.3+    | Authentication & session management  |
| **Styling**         | Tailwind CSS | 4.x     | Utility-first CSS framework          |
| **Components**      | shadcn/ui    | Latest  | Radix UI + Tailwind components       |
| **Icons**           | Lucide React | Latest  | Beautiful consistent icons           |
| **Testing**         | Vitest       | 4.x     | Fast unit testing framework          |
| **Package Manager** | pnpm         | 8.x+    | Fast, disk-efficient package manager |

### Why These Technologies?

- **Next.js 16**: Cutting-edge React framework with App Router, Server Components, and excellent DX
- **Convex**: Eliminates the complexity of traditional backends - no REST/GraphQL APIs to build, real-time by default
- **Better Auth**: Modern auth library with native Convex integration, avoiding external auth services
- **shadcn/ui**: Copy-paste components you own, built on Radix UI primitives for accessibility
- **TypeScript**: End-to-end type safety from database to frontend

---

## Project Structure

```
ai-starter-kit/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (if any)
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── page.tsx              # Dashboard home with charts
│   │   └── data.json             # Sample data
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── ConvexClientProvider.tsx  # Convex + Better Auth provider
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home/landing page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components (20+)
│   ├── app-sidebar.tsx           # Main application sidebar
│   ├── login-form.tsx            # Login form component
│   ├── signup-form.tsx           # Signup form component
│   └── data-table.tsx            # Reusable data table
│
├── convex/                       # Convex backend
│   ├── _generated/               # Auto-generated types & API
│   ├── auth.config.ts            # Better Auth configuration
│   ├── auth.ts                   # Auth helper functions
│   ├── http.ts                   # HTTP routes (auth endpoints)
│   ├── schema.ts                 # Database schema
│   ├── test.setup.ts             # Test configuration
│   └── TESTING.md                # Testing documentation
│
├── lib/                          # Shared utilities
│   ├── auth-client.ts            # Better Auth React client
│   └── utils.ts                  # Helper functions (cn, etc.)
│
├── hooks/                        # React hooks
│   └── use-mobile.ts             # Mobile detection hook
│
├── docs/                         # Documentation
│   ├── QUICK_START.md            # 5-minute setup guide
│   ├── SETUP.md                  # Detailed setup instructions
│   ├── ARCHITECTURE.md           # System architecture
│   ├── DEVELOPMENT.md            # Development workflows
│   ├── DEPLOYMENT.md             # Production deployment
│   ├── API.md                    # API documentation
│   ├── DATABASE.md               # Database schema guide
│   ├── AUTHENTICATION.md         # Auth flow details
│   ├── TROUBLESHOOTING.md        # Common issues & solutions
│   └── IDE_TOOLS.md              # IDE enhancement tools
│
├── .github/                      # GitHub templates
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md  # PR template
│
├── middleware.ts                 # Next.js middleware (route protection)
├── CLAUDE.md                     # Claude AI development guide
├── CONTRIBUTING.md               # Contribution guidelines
├── CODE_OF_CONDUCT.md            # Code of conduct
├── CHANGELOG.md                  # Version history
├── ROADMAP.md                    # Future plans
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
pnpm run dev              # Run both frontend and backend in parallel
pnpm run dev:frontend     # Run Next.js only
pnpm run dev:backend      # Run Convex only
pnpm run predev           # Convex dev + auto-open dashboard

# Building
pnpm run build            # Build Next.js for production
pnpm run start            # Start production server

# Code Quality
pnpm run lint             # Run ESLint

# Testing
pnpm run test             # Run tests in watch mode
pnpm run test:once        # Run tests once
pnpm run test:debug       # Debug tests with inspector
pnpm run test:coverage    # Run with coverage report
```

### Adding New Features

```bash
# Add a new shadcn/ui component
npx shadcn@latest add [component-name]

# Generate Convex types (after schema changes)
npx convex codegen

# Open Convex dashboard
npx convex dashboard
```

### Environment Variables

Create a `.env.local` file for Next.js (auto-generated by Convex):

```bash
# Auto-generated by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# IMPORTANT: Set this to your Convex HTTP endpoint (.convex.site, NOT .convex.cloud)
# This is used to proxy auth requests from Next.js to Convex
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

> **Warning**: `NEXT_PUBLIC_CONVEX_SITE_URL` must point to your Convex site URL (ending in `.convex.site`), NOT `localhost:3000`. Setting it to `localhost:3000` will cause an infinite loop and 500 errors on auth endpoints.

Set Convex environment variables:

```bash
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
npx convex env set SITE_URL http://localhost:3000
```

See [`.env.example`](./.env.example) for all available variables.

---

## Testing

This starter includes a complete testing setup with Vitest and convex-test:

```bash
# Run tests in watch mode
pnpm run test

# Run tests once (CI mode)
pnpm run test:once

# Run with coverage
pnpm run test:coverage
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

### Deploy to Vercel (Recommended)

1. **Push to GitHub**

   ```bash
   git push origin main
   ```

2. **Deploy Frontend**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Deploy Backend**

   ```bash
   npx convex deploy
   ```

4. **Set Production Environment Variables**

   ```bash
   npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32) --prod
   npx convex env set SITE_URL https://your-domain.vercel.app --prod
   ```

5. **Update Vercel Environment Variables**
   - Add `NEXT_PUBLIC_CONVEX_URL` with your production Convex URL

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions, custom domains, and other platforms.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm run test:once`)
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

- [Next.js](https://nextjs.org/) - The React Framework
- [Convex](https://convex.dev/) - The reactive backend
- [Better Auth](https://better-auth.com/) - Authentication for TypeScript
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components

---

**Made with ❤️ by [Robert Guss](https://github.com/robertguss)**

If this starter kit helped you, consider giving it a ⭐️ on GitHub!
