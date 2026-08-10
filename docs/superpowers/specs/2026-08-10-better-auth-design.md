# Better Auth Integration Design

## Goal
Add authentication to voicemail-ai using Better Auth with Convex adapter. Protect web UI and API routes with email/password login (OAuth ready for future).

## Current State
- No auth system — app is completely open
- Users identified by phone number (WhatsApp only via Sendblue)
- No login/signup pages (placeholder links in navbar)
- Composio uses hardcoded `"voicemail-user"` — no user isolation
- Two access points: Web UI (`/assistant`) and WhatsApp webhook

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Web UI (Next.js)                   │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │  Login   │  │  Signup  │  │    Assistant Page      │ │
│  │  Page    │  │  Page    │  │   (Protected)          │ │
│  └────┬─────┘  └────┬─────┘  └──────────┬─────────────┘ │
│       │              │                   │               │
│       └──────────────┴───────────────────┘               │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │  Middleware│ (checks session)        │
│                    └─────┬─────┘                         │
└──────────────────────────┼──────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    Better Auth Server   │
              │  /api/auth/* endpoints  │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   Convex Database       │
              │  - users (extended)     │
              │  - sessions             │
              │  - accounts             │
              │  - verifications        │
              └─────────────────────────┘
```

## Convex Schema Changes

Extend schema with Better Auth tables:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authSchema } from "better-auth/convex";

export default defineSchema({
  // Better Auth tables (auto-created)
  ...authSchema,

  // Existing tables (kept as-is)
  messages: defineTable({
    phoneNumber: v.string(),
    role: v.string(),
    content: v.string(),
  }).index("by_phoneNumber", ["phoneNumber"]),
});
```

**Changes:**
- `users` table gets additional auth fields (email, name, image, emailVerified)
- New `sessions` table for tracking logins
- New `accounts` table for OAuth providers
- New `verifications` table for magic links/email verification
- `messages` table stays exactly the same

## Auth Configuration

**File:** `src/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { convexAdapter } from "better-auth/adapters/convex";

export const auth = betterAuth({
  database: convexAdapter(process.env.CONVEX_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
  },
});
```

**API routes (auto-generated):**
- `POST /api/auth/sign-up/email` — email/password signup
- `POST /api/auth/sign-in/email` — email/password login
- `POST /api/auth/sign-in/social` — OAuth redirect
- `GET /api/auth/callback/:provider` — OAuth callback
- `POST /api/auth/sign-out` — logout
- `GET /api/auth/session` — get current user

**Environment variables:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
BETTER_AUTH_SECRET=
```

## Middleware & Route Protection

**File:** `src/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");

  const protectedPaths = ["/assistant", "/api/composio", "/api/realtime"];
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/assistant/:path*", "/api/composio/:path*", "/api/realtime/:path*"],
};
```

**Protected routes:**
- `/assistant` — voice assistant page
- `/api/composio/*` — Gmail/Calendar API routes
- `/api/realtime/*` — OpenAI realtime token

**Open routes:**
- `/` — landing page
- `/login` — login page
- `/signup` — signup page
- `/api/auth/*` — Better Auth endpoints

## Login & Signup Pages

**Login page:** `src/app/login/page.tsx`
- Email/password form
- Calls `/api/auth/sign-in/email`
- Redirects to `/assistant` on success
- Error handling for invalid credentials
- Link to signup page

**Signup page:** `src/app/signup/page.tsx`
- Email/password form
- Calls `/api/auth/sign-up/email`
- Auto-signs in after registration
- Link to login page

**Styling:**
- Matches existing shadcn/ui style
- Minimal, clean design
- Loading and error states

## Session Hook & User Context

**Session hook:** `src/hooks/use-session.ts`

```typescript
"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { user, loading };
}
```

**User menu component:** `src/components/user-menu.tsx`
- Shows user avatar/email in navbar
- Sign out button
- Replaces login/signup links when authenticated

## Implementation Steps

1. Install Better Auth packages
2. Create auth configuration (`src/lib/auth.ts`)
3. Update Convex schema with auth tables
4. Create API route handler (`src/app/api/auth/[...all]/route.ts`)
5. Add middleware for route protection
6. Create login page (`src/app/login/page.tsx`)
7. Create signup page (`src/app/signup/page.tsx`)
8. Create session hook (`src/hooks/use-session.ts`)
9. Create user menu component
10. Update navbar to show user menu when authenticated
11. Add environment variables
12. Test authentication flow

## Open Questions

1. Should we add email verification in v1 or skip for now?
2. Do you want "remember me" functionality?
3. Should the WhatsApp flow link to auth users later?
