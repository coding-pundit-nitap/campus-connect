import NextAuth from "next-auth";
import { authConfig } from "@/config/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Exports authentication utilities and handlers from NextAuth, configured with JWT session strategy and custom settings.
 *
 * - `handlers`: NextAuth request handlers for API routes.
 * - `auth`: Middleware for protecting routes and accessing session data.
 * - `signIn`: Function to initiate user sign-in.
 * - `signOut`: Function to sign out the current user.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  ...authConfig,
});
