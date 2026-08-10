# Better Auth Implementation Plan

**Goal:** Add Better Auth with Convex adapter to protect web UI and API routes with email/password login.

**Architecture:** Better Auth runs as Next.js API routes, stores sessions in Convex, middleware protects /assistant and API routes.

**Tech Stack:** Better Auth, Convex, Next.js middleware, shadcn/ui

---

## Task 1: Install Dependencies

- [ ] Run `npm install better-auth`
- [ ] Verify with `npm ls better-auth`
- [ ] Commit: `git add package.json package-lock.json && git commit -m "feat: add better-auth dependency"`

## Task 2: Create Auth Configuration

**Create:** `src/lib/auth.ts`

- [ ] Create auth config with Convex adapter, email/password enabled, OAuth providers ready
- [ ] Commit: `git add src/lib/auth.ts && git commit -m "feat: add better-auth configuration"`

## Task 3: Create Auth API Route Handler

**Create:** `src/app/api/auth/[...all]/route.ts`

- [ ] Create catch-all route handler using toNextJsHandler
- [ ] Commit: `git add src/app/api/auth/ && git commit -m "feat: add auth API route handler"`

## Task 4: Update Convex Schema

**Modify:** `convex/schema.ts`

- [ ] Add auth tables: users (extended), sessions, accounts, verifications
- [ ] Keep existing messages table
- [ ] Commit: `git add convex/schema.ts && git commit -m "feat: add auth tables to convex schema"`

## Task 5: Create Middleware

**Create:** `src/middleware.ts`

- [ ] Create middleware to protect /assistant, /api/composio, /api/realtime
- [ ] Redirect unauthenticated users to /login
- [ ] Commit: `git add src/middleware.ts && git commit -m "feat: add auth middleware"`

## Task 6: Create Login Page

**Create:** `src/app/login/page.tsx`

- [ ] Create login form with email/password
- [ ] Call /api/auth/sign-in/email
- [ ] Handle errors and loading states
- [ ] Link to signup page
- [ ] Commit: `git add src/app/login/ && git commit -m "feat: add login page"`

## Task 7: Create Signup Page

**Create:** `src/app/signup/page.tsx`

- [ ] Create signup form with name/email/password
- [ ] Call /api/auth/sign-up/email
- [ ] Auto-sign in after registration
- [ ] Link to login page
- [ ] Commit: `git add src/app/signup/ && git commit -m "feat: add signup page"`

## Task 8: Create Session Hook

**Create:** `src/hooks/use-session.ts`

- [ ] Create useSession hook that fetches /api/auth/session
- [ ] Return user object and loading state
- [ ] Commit: `git add src/hooks/use-session.ts && git commit -m "feat: add session hook"`

## Task 9: Create User Menu Component

**Create:** `src/components/user-menu.tsx`

- [ ] Show user email/avatar when authenticated
- [ ] Sign out button
- [ ] Commit: `git add src/components/user-menu.tsx && git commit -m "feat: add user menu component"`

## Task 10: Update Navbar

**Modify:** `src/components/ui/mini-navbar.tsx`

- [ ] Use useSession hook
- [ ] Show UserMenu when authenticated, login/signup links when not
- [ ] Commit: `git add src/components/ui/mini-navbar.tsx && git commit -m "feat: update navbar with auth state"`

## Task 11: Add Environment Variables

**Modify:** `.env.example`

- [ ] Add BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
- [ ] Commit: `git add .env.example && git commit -m "docs: add auth env vars to example"`

## Task 12: Test Authentication Flow

- [ ] Run `npm run dev`
- [ ] Test signup at /signup
- [ ] Test login at /login
- [ ] Test protected route redirect
- [ ] Test sign out
