# Architecture Overview

This document explains the system architecture, design patterns, and key decisions behind the AI Starter Kit.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Authentication Flow](#authentication-flow)
- [Data Flow](#data-flow)
- [Key Design Decisions](#key-design-decisions)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js 16 (Frontend)                     │ │
│  │  • React 19 Components                                 │ │
│  │  • App Router (app/)                                   │ │
│  │  • Server & Client Components                          │ │
│  │  • shadcn/ui + Tailwind CSS 4                         │ │
│  └──────────────────┬─────────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ Convex Client (WebSocket + HTTP)
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Convex Cloud                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Convex Backend (Serverless)                  │ │
│  │  • Real-time Database                                  │ │
│  │  • Query/Mutation/Action Functions                     │ │
│  │  • Better Auth Integration (Component)                 │ │
│  │  • HTTP Endpoints (/api/auth/*)                        │ │
│  │  • Automatic TypeScript Generation                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Technologies |
|-------|---------------|--------------|
| **Presentation** | UI rendering, user interactions | React 19, shadcn/ui, Tailwind |
| **Application** | Business logic, routing, state management | Next.js 16, React hooks |
| **API** | Client-server communication | Convex Client, WebSocket |
| **Backend** | Data processing, auth, business rules | Convex functions (Query/Mutation/Action) |
| **Database** | Data persistence, real-time subscriptions | Convex database (PostgreSQL-compatible) |
| **Auth** | Authentication, session management | Better Auth + Convex component |

---

## Frontend Architecture

### Directory Structure

```
app/
├── (routes)/
│   ├── page.tsx              # Landing page (public)
│   ├── login/                # Login page (public)
│   ├── signup/               # Signup page (public)
│   └── dashboard/            # Protected area
├── ConvexClientProvider.tsx  # Global Convex provider
├── layout.tsx                # Root layout
└── globals.css               # Global styles

components/
├── ui/                       # shadcn/ui components (atomic)
├── login-form.tsx            # Feature components
├── signup-form.tsx
└── app-sidebar.tsx           # Layout components

lib/
├── auth-client.ts            # Better Auth client setup
└── utils.ts                  # Utility functions (cn, etc.)
```

### Component Hierarchy

```
RootLayout (app/layout.tsx)
├─ ConvexClientProvider
│  └─ ConvexBetterAuthProvider
│     └─ Page Routes
│        ├─ Public Pages (/, /login, /signup)
│        └─ Protected Pages (/dashboard/*)
│           └─ AppSidebar (navigation)
```

### State Management Strategy

**No global state library needed!** Convex handles state through reactive queries:

1. **Server State**: Convex queries (auto-updating)
2. **Local UI State**: React hooks (`useState`, `useReducer`)
3. **Form State**: Controlled components
4. **Auth State**: Managed by Better Auth + Convex

Example reactive data flow:
```typescript
// Component automatically re-renders when data changes
const numbers = useQuery(api.myFunctions.listNumbers, { count: 10 });
```

---

## Backend Architecture

### Convex Function Types

```
┌─────────────────────────────────────────────────────────────┐
│                    Convex Functions                          │
├─────────────────────────────────────────────────────────────┤
│  Queries (Read-only, Real-time, Cached)                     │
│  • Can read database                                         │
│  • Cannot modify database                                    │
│  • Automatically cached and reactive                         │
│  • Example: listNumbers, getUser                             │
├─────────────────────────────────────────────────────────────┤
│  Mutations (Write, Transactional)                            │
│  • Can read and write database                               │
│  • ACID transactions                                         │
│  • Cannot call external APIs                                 │
│  • Example: addNumber, updateUser                            │
├─────────────────────────────────────────────────────────────┤
│  Actions (Long-running, External APIs)                       │
│  • Cannot directly access database                           │
│  • Can call external APIs                                    │
│  • Can run mutations/queries via ctx.runMutation()           │
│  • Example: sendEmail, callAI                                │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Pattern

Defined in `convex/schema.ts`:

```typescript
export default defineSchema({
  tableName: defineTable({
    field: v.string(),
    createdAt: v.number(),
    // ...
  })
    .index("by_field", ["field"])  // Fast lookups
    .searchIndex("search_field", { searchField: "field" }),
});
```

**Best Practices:**
- Define indexes for common queries
- Use descriptive index names (e.g., `by_userId_and_status`)
- Add search indexes for text search needs

---

## Authentication Flow

### Registration Flow

```
User fills signup form
       ↓
SignupForm.tsx (client)
       ↓
POST /api/auth/sign-up (Better Auth HTTP endpoint)
       ↓
Better Auth creates user in Convex tables:
  • authUser
  • authAccount
  • authSession
       ↓
Session cookie set
       ↓
Redirect to /dashboard
```

### Login Flow

```
User fills login form
       ↓
LoginForm.tsx (client)
       ↓
POST /api/auth/sign-in (Better Auth HTTP endpoint)
       ↓
Better Auth validates credentials
       ↓
Create session in authSession table
       ↓
Session cookie set
       ↓
Redirect to /dashboard
```

### Route Protection (Middleware)

```
User navigates to /dashboard
       ↓
middleware.ts intercepts request
       ↓
Check if route starts with /dashboard
       ↓
GET /api/auth/get-session
       ↓
If no session: Redirect to /login?redirect=/dashboard
If session exists: Allow access
```

### Session Validation

Sessions are validated on every protected route access:

1. Middleware checks session cookie
2. Calls `/api/auth/get-session`
3. Better Auth validates session against database
4. Returns user info or null

**Session Duration**: 7 days (configurable in `auth.config.ts`)

---

## Data Flow

### Read Data Flow (Query)

```
Component calls useQuery()
       ↓
Convex Client subscribes to query
       ↓
WebSocket connection to Convex
       ↓
Query function executes on server
       ↓
Read from database
       ↓
Result streamed to client (WebSocket)
       ↓
Component re-renders with data
       ↓
[Real-time] Database changes → Auto-update → Component re-renders
```

### Write Data Flow (Mutation)

```
Component calls useMutation()
       ↓
User triggers action (e.g., button click)
       ↓
mutation() function sent to Convex
       ↓
Transaction begins
       ↓
Validate inputs
       ↓
Write to database
       ↓
Transaction commits
       ↓
All subscribed queries automatically refresh
       ↓
UI updates reactively
```

### Example: Adding a Number

```typescript
// Component (Frontend)
const addNumber = useMutation(api.myFunctions.addNumber);
const numbers = useQuery(api.myFunctions.listNumbers, { count: 10 });

await addNumber({ value: 42 });
// numbers automatically updates! No need to manually refetch.
```

---

## Key Design Decisions

### Why Convex?

**Traditional Stack:**
```
Frontend → REST/GraphQL API → Server → Database
         ↓ Manual caching, polling, or websockets
```

**With Convex:**
```
Frontend ← WebSocket → Convex (Backend + Database unified)
         ↓ Automatic real-time updates
```

**Benefits:**
- **No API layer to build**: Define functions, call them directly
- **Real-time by default**: All queries auto-update
- **Type-safe**: TypeScript from DB to frontend
- **Serverless**: No infrastructure to manage
- **ACID transactions**: Automatic consistency

### Why Better Auth?

Alternatives considered: NextAuth, Clerk, Auth0

**Why Better Auth:**
- ✅ Native Convex integration
- ✅ No external auth service required
- ✅ Full control over auth logic
- ✅ Open source
- ✅ TypeScript-first
- ✅ Session stored in your database

### Why Next.js 16?

- Latest React 19 features (Server Components, Actions)
- App Router for modern routing
- Built-in optimizations (image, font, script)
- Excellent TypeScript support
- Best-in-class developer experience

### Why shadcn/ui?

Alternatives: Material UI, Ant Design, Chakra UI

**Why shadcn/ui:**
- ✅ Copy-paste components you own
- ✅ Built on Radix UI (accessible)
- ✅ Tailwind CSS for customization
- ✅ No bloat (only install what you use)
- ✅ Consistent design system

### Why pnpm?

- **Faster** than npm/yarn (symlinked node_modules)
- **Disk efficient** (global store)
- **Strict** (prevents phantom dependencies)

---

## Security Architecture

### Authentication Security

- ✅ Passwords hashed with bcrypt
- ✅ Session tokens encrypted
- ✅ CSRF protection via Better Auth
- ✅ Secure cookie settings (httpOnly, sameSite)

### Database Security

- ✅ No direct database access from frontend
- ✅ All queries run through Convex functions
- ✅ Row-level security via function logic
- ✅ Type validation on all inputs

### Environment Security

- ✅ Secrets stored in Convex env (not in code)
- ✅ `.env.local` gitignored
- ✅ No sensitive data in frontend bundles

---

## Performance Optimizations

### Frontend

- **Next.js Turbo** mode for faster builds
- **React 19** automatic optimizations
- **Code splitting** per route
- **Image optimization** built-in

### Backend

- **Convex caching** for queries
- **Indexed queries** for fast lookups
- **Reactive subscriptions** (no polling)
- **Serverless scaling** (auto-scales to load)

### Bundle Size

- **Tree-shaking** removes unused code
- **Dynamic imports** for lazy loading
- **shadcn/ui** only includes used components

---

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: Deploys to CDN (Vercel Edge)
- **Backend**: Convex auto-scales serverless functions
- **Database**: Convex handles sharding/replication

### Database Limits

- **Free tier**: 1GB storage, 1M function calls/month
- **Paid tier**: Unlimited scale

### Real-time Connections

- WebSocket connections pooled and managed by Convex
- Supports thousands of concurrent users per deployment

---

## Testing Architecture

```
┌──────────────────────────────────────────────┐
│  Frontend Tests (Future)                     │
│  • React Testing Library                     │
│  • Component unit tests                      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Backend Tests (Implemented)                 │
│  • Vitest + convex-test                      │
│  • Isolated mock environment                 │
│  • Example: convex/myFunctions.test.ts       │
└──────────────────────────────────────────────┘
```

See [Testing Guide](../convex/TESTING.md) for details.

---

## Deployment Architecture

### Development

```
Local Machine
├─ Next.js dev server (localhost:3000)
└─ Convex dev environment (cloud-hosted)
```

### Production

```
Vercel (Frontend)
├─ Static pages cached on CDN
├─ Server Components rendered on Edge
└─ API routes proxied to Convex

Convex Cloud (Backend)
├─ Production database
├─ Serverless functions
└─ WebSocket servers
```

---

## Further Reading

- [Development Guide](./DEVELOPMENT.md) - Build features
- [Database Guide](./DATABASE.md) - Schema design
- [API Reference](./API.md) - Available functions
- [Deployment](./DEPLOYMENT.md) - Production setup

---

**Previous:** [← Setup Guide](./SETUP.md) | **Next:** [Development →](./DEVELOPMENT.md)
