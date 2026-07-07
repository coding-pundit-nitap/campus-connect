import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "@/auth";
import { env } from "@/config/env.config";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : env.NEXT_PUBLIC_APP_URL || "";

export const authClient = createAuthClient({
  baseURL,
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, useSession, updateUser } = authClient;
