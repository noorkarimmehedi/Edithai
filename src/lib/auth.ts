import { betterAuth } from "better-auth";
import { convexAdapter } from "better-auth/adapters/convex";

export const auth = betterAuth({
  database: convexAdapter(process.env.CONVEX_URL!),
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
