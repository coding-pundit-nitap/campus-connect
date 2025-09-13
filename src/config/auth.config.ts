import { Role } from "@prisma/client";
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google, { GoogleProfile } from "next-auth/providers/google";

import { verifyPassword } from "@/lib/auth";
import shopRepository from "@/repositories/shop.repository";
import userRepository from "@/repositories/user.repository";
import { loginSchema } from "@/validations/auth";

/**
 * NextAuth configuration object that defines authentication providers, callbacks, and settings.
 * This configuration handles both OAuth (Google) and credentials-based authentication.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    /**
     * Google OAuth provider configuration
     * Allows users to sign in using their Google account
     */
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      /**
       * Custom profile mapping function
       * Transforms Google profile data into our application's user format
       * @param profile - Google profile data received from OAuth
       * @returns User object with standardized fields
       */
      profile: async (profile: GoogleProfile) => {
        return {
          id: profile.sub,
          role: Role.USER,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    /**
     * Credentials provider for email/password authentication
     * Handles traditional username/password login flow
     */
    Credentials({
      name: "credentials",
      // Define the form fields for the credentials provider
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      /**
       * Authorization function that validates user credentials
       * @param credentials - User-provided email and password
       * @returns User object if valid, null if invalid
       */
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);

        if (parsed.success) {
          const { email, password } = parsed.data;

          // 1. Find the user in your database
          const user = await userRepository.findByEmail(email, {
            select: {
              id: true,
              hash_password: true,
              role: true,
            },
          });

          // 2. If no user is found, or if they don't have a password (e.g., signed up with Google), reject login
          if (!user || !user.hash_password) {
            return null;
          }

          // 3. Compare the provided password with the stored hash
          const passwordsMatch = await verifyPassword(
            password,
            user.hash_password
          );

          // 4. If passwords match, return the user object
          if (passwordsMatch) {
            return user;
          }
        }

        // 5. If anything fails, return null
        console.error("Invalid credentials provided");

        return null;
      },
    }),
  ],
  /**
   * Callback functions that handle various stages of the authentication flow
   */
  callbacks: {
    /**
     * Controls whether a user is allowed to sign in
     * @param user - User object from the provider
     * @param account - Account object containing provider information
     * @returns Boolean indicating whether sign-in should be allowed
     */
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true; // Allow sign-in with credentials
      }
      if (!user) {
        return false; // Prevent sign-in if user is not defined
      }
      return true; // Allow sign-in for other providers (Google, etc.)
    },
    /**
     * Handles JWT token creation and modification
     * Called whenever a JWT is accessed (e.g., during sign-in or when accessing session)
     * @param token - JWT token object
     * @param user - User object (only available during initial sign-in)
     * @returns Modified token object
     */
    async jwt({ token, user }) {
      // Only update token if user is present (during initial sign-in)
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
        const shop = await shopRepository.findByOwnerId(user.id, {
          select: { id: true },
        });
        if (shop) {
          token.shop_id = shop.id;
        }
      }
      return token;
    },
    /**
     * Handles session object creation and modification
     * Called whenever a session is checked (e.g., getSession, useSession)
     * @param session - Session object containing user data
     * @returns Modified session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        if (token.shop_id) {
          session.user.shop_id = token.shop_id as string;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/login", // Custom login page
    signOut: "/", // Redirect after sign out
    error: "/", // Error page for authentication errors
    newUser: "/register", // New user registration page
  },
};
