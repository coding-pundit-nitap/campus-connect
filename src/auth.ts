import { Role } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "./lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL as string],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
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
    },
  },
});
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
