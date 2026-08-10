# Architecture Overview

This document explains the system architecture, design patterns, and key
decisions behind the AI Starter Kit.

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
│  │              TanStack Start (Frontend)                     │ │
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
│  │  • Clerk JWT validation (auth.config.ts)               │ │
│  │  • getCurrentUser via ctx.auth.getUserIdentity()       │ │
│  │  • Automatic TypeScript Generation                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer            | Responsibility                            | Technologies                             |
| ---------------- | ----------------------------------------- | ---------------------------------------- |
| **Presentation** | UI rendering, user interactions           | React 19, shadcn/ui, Tailwind            |
| **Application**  | Business logic, routing, state management | TanStack Start, React hooks              |
| **API**          | Client-server communication               | Convex Client, WebSocket                 |
| **Backend**      | Data processing, auth, business rules     | Convex functions (Query/Mutation/Action) |
| **Database**     | Data persistence, real-time subscriptions | Convex database (PostgreSQL-compatible)  |
| **Auth**         | Authentication, session management        | Clerk + Convex JWT validation            |

---

## Frontend Architecture

### Directory Structure

```
app/
├── page.tsx                    # Landing page (public)
├── login/[[...sign-in]]/       # Clerk SignIn
├── signup/[[...sign-up]]/      # Clerk SignUp
├── dashboard/                  # Protected area
│   └── layout.tsx              # `beforeLoad` + server `auth()`
├── ConvexClientProvider.tsx    # ConvexProviderWithClerk
├── layout.tsx                  # ClerkProvider + root layout
└── globals.css                 # Global styles

components/
├── ui/                         # shadcn/ui components (atomic)
├── nav-user.tsx                 # Clerk signOut menu
└── app-sidebar.tsx             # Layout components

lib/
└── utils.ts                    # Utility functions (cn, etc.)

app/start.ts                        # clerkMiddleware (TanStack Start)
```

### Component Hierarchy

```
RootLayout (app/routes/__root.tsx)
├─ ClerkProvider
│  └─ ConvexClientProvider (ConvexProviderWithClerk)
│     └─ Page Routes
│        ├─ Public Pages (/, /login, /signup)
│        └─ Protected Pages (/dashboard/*)
│           └─ AppSidebar (navigation)
```

### State Management Strategy

**No global state library needed!** Convex handles state through reactive
queries:

1. **Server State**: Convex queries (auto-updating)
2. **Local UI State**: React hooks (`useState`, `useReducer`)
3. **Form State**: Controlled components
4. **Auth State**: Clerk session + Convex JWT (`useConvexAuth`)

Example reactive data flow:

```typescript
// Component automatically re-renders when data changes
const items = useQuery(api.myModule.listItems, { count: 10 });
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
│  • Example: listItems, getUser                               │
├─────────────────────────────────────────────────────────────┤
│  Mutations (Write, Transactional)                            │
│  • Can read and write database                               │
│  • ACID transactions                                         │
│  • Cannot call external APIs                                 │
│  • Example: createItem, updateUser                           │
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
    .index("by_field", ["field"]) // Fast lookups
    .searchIndex("search_field", { searchField: "field" }),
});
```

**Best Practices:**

- Define indexes for common queries
- Use descriptive index names (e.g., `by_userId_and_status`)
- Add search indexes for text search needs

---

## Authentication Flow

### Sign-up / sign-in flow

```
User opens /signup or /login
       ↓
Clerk <SignUp> / <SignIn> (path routing)
       ↓
Clerk creates session cookie
       ↓
ConvexProviderWithClerk fetches JWT (template "convex")
       ↓
Convex validates JWT via CLERK_JWT_ISSUER_DOMAIN
       ↓
Redirect to /dashboard
```

### Route protection

```
User navigates to /dashboard
       ↓
app/start.ts clerkMiddleware runs
       ↓
If not authenticated: redirectToSignIn()
       ↓
app/routes/_authenticated/route.tsx awaits `beforeLoad` + server `auth()`
       ↓
Page renders; Convex queries use the Clerk JWT
```

### Identity on the backend

1. Client sends the Clerk JWT with Convex requests
2. Convex matches the issuer in `convex/auth.config.ts`
3. `ctx.auth.getUserIdentity()` returns claims (or null)
4. `api.auth.getCurrentUser` maps claims to `{ subject, name, email, image? }`

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

### Example: Creating an Item

```typescript
// Component (Frontend)
const createItem = useMutation(api.myModule.createItem);
const items = useQuery(api.myModule.listItems, { count: 10 });

await createItem({ name: "New item" });
// items automatically updates! No need to manually refetch.
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

### Why Clerk?

**Why Clerk for this kit:**

- Hosted sign-in/sign-up UI with path routing
- First-party Convex JWT template (`applicationID: "convex"`)
- Session cookies and user management outside your Convex schema
- MCP support at `https://mcp.clerk.com/mcp`

### Why TanStack Start?

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

### Why aube?

- Fast installs with a shared global virtual store where compatible
- First-class `aubr` / `aubx` scripts used throughout this kit
- Deterministic lockfile (`aube-lock.yaml`)

---

## Security Architecture

### Authentication Security

- Clerk hosts credentials and session cookies
- Convex trusts only JWTs for the `convex` application ID
- Secrets stay in `.env.local` and Convex env (not in the client bundle)

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

- **Vite** + TanStack Start for fast local builds
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
│  • Place tests in convex/ directory           │
└──────────────────────────────────────────────┘
```

See [Testing Guide](../convex/TESTING.md) for details.

---

## Deployment Architecture

### Development

```
Local Machine
├─ TanStack Start / Vite dev server (localhost:3000)
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

**Previous:** [← Setup Guide](./SETUP.md) | **Next:**
[Development →](./DEVELOPMENT.md)
