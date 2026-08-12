import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { AuthClient } from "@convex-dev/better-auth/react";

export const authClient = createAuthClient({
  plugins: [convexClient()],
}) as unknown as AuthClient;
