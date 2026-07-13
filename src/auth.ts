import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { Role, UserStatus } from "@/types/prisma.types";

import { env } from "./config/env.config";
import { prisma } from "./lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: env.BETTER_AUTH_URL,
  trustHost: true,
  emailAndPassword: {
    enabled: false,
  },
  trustedOrigins: env.NEXT_PUBLIC_APP_URL ? [env.NEXT_PUBLIC_APP_URL] : [],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { status: true },
          });
          if (user?.status === UserStatus.SUSPENDED) {
            throw new Error(
              "Your account has been suspended. Please contact support."
            );
          }
          if (user?.status === UserStatus.BANNED) {
            throw new Error("Your account has been banned.");
          }
          return { data: session };
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: Object.values(Role),
        defaultValue: Role.USER,
        required: true,
        input: false,
        fieldName: "role",
      },
      shop_id: {
        type: "string",
        required: false,
        fieldName: "shop_id",
      },
      phone: {
        type: "string",
        fieldName: "phone",
      },
      status: {
        type: Object.values(UserStatus),
        defaultValue: UserStatus.ACTIVE,
        required: true,
        input: false,
        fieldName: "status",
      },
    },
  },
  defaultCookieAttributes: {
    sameSite:
      env.NODE_ENV === "production" && env.BETTER_AUTH_URL?.startsWith("https")
        ? "none"
        : "lax",
    secure:
      env.NODE_ENV === "production" && env.BETTER_AUTH_URL?.startsWith("https"),
  },
});
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
