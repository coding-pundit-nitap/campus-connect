import { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    shop_id?: string;
    phone?: string;
  }

  interface Session {
    user: DefaultSession["user"] & User;
  }
}

declare module "next-auth/jwt" {
  interface User {
    role: Role;
  }
  interface JWT {
    user: DefaultSession["user"] & User;
  }
}
