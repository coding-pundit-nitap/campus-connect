import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { Role, UserStatus } from "@/types/prisma.types";

import { prisma } from "./lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: false,
  },
  trustedOrigins: process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : [],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
      process.env.NODE_ENV === "production" &&
      process.env.BETTER_AUTH_URL?.startsWith("https")
        ? "none"
        : "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.BETTER_AUTH_URL?.startsWith("https"),
  },
});
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
