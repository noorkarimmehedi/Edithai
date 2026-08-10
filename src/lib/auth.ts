import { betterAuth } from "better-auth";
import { convexAdapter, type GenericCtx } from "@convex-dev/better-auth";

export const auth = betterAuth({
  // NOTE: convexAdapter requires Convex component API, not a URL.
  // This file needs to be refactored to follow the Convex component pattern.
  // See: https://labs.convex.dev/better-auth/framework-guides/next
  database: convexAdapter({} as any, {} as any),
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
    sendOnSignUp: false, // Skip for now, enable later
  },
});

export type Session = typeof auth.$Infer.Session;
