/**
 * Handles and normalizes errors from authentication actions.
 *
 * Provides consistent error message extraction from various error types
 * encountered during authentication operations. Safely handles unknown error
 * types and provides fallback messaging for better user experience.
 *
 * @example
 * ```typescript
 * // Handle errors in authentication flow
 * try {
 *   await loginUser(credentials);
 * } catch (error) {
 *   const message = handleActionError(error, 'Login failed');
 *   setErrorMessage(message);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use in server actions
 * export async function signUpAction(formData: FormData) {
 *   try {
 *     // ... signup logic
 *   } catch (error) {
 *     return {
 *       success: false,
 *       message: handleActionError(error, 'Registration failed')
 *     };
 *   }
 * }
 * ```
 *
 * @param error - The error object or value to handle
 * @param defaultMessage - Fallback message when error cannot be processed
 * @returns A user-friendly error message string
 *
 * @see {@link hashPassword} for password hashing errors
 * @see {@link verifyPassword} for verification errors
 *
 * @since 1.0.0
 */
export const handleActionError = (
  error: unknown,
  defaultMessage: string = "An unexpected error occurred",
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  console.error("Unhandled error type:", error);
  return defaultMessage;
};

/**
 * Securely hashes a password using PBKDF2 with SHA-256.
 *
 * Generates a cryptographically secure hash suitable for database storage.
 * Uses a random 16-byte salt and 100,000 iterations to provide strong
 * protection against rainbow table and brute-force attacks.
 *
 * @example
 * ```typescript
 * // Hash password during user registration
 * const registerUser = async (email: string, password: string) => {
 *   const hashedPassword = await hashPassword(password);
 *   await saveUser({ email, password: hashedPassword });
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Hash password in server action
 * export async function createAccount(formData: FormData) {
 *   const password = formData.get('password') as string;
 *   const hashedPassword = await hashPassword(password);
 *
 *   await prisma.user.create({
 *     data: {
 *       email: formData.get('email') as string,
 *       password: hashedPassword,
 *     },
 *   });
 * }
 * ```
 *
 * @param password - The plain text password to hash
 * @returns A promise that resolves to a base64-encoded hash string
 *
 * @throws {Error} When crypto.getRandomValues is not available
 *
 * @see {@link verifyPassword} for password verification
 * @see {@link https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html} OWASP Password Storage Guidelines
 *
 * @since 1.0.0
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const deriveBits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, keyMaterial, 256);

  const hash = new Uint8Array(deriveBits);
  const combined = new Uint8Array(salt.length + hash.length);
  combined.set(salt);
  combined.set(hash, salt.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Verifies a password against its stored hash using timing-safe comparison.
 *
 * Securely compares a plain text password with its previously generated hash.
 * Uses the same PBKDF2 parameters and implements timing-safe comparison to
 * prevent timing attacks that could reveal information about the stored hash.
 *
 * @example
 * ```typescript
 * // Verify password during login
 * const loginUser = async (email: string, password: string) => {
 *   const user = await findUserByEmail(email);
 *   if (!user) return false;
 *
 *   const isValid = await verifyPassword(password, user.password);
 *   return isValid;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Use in authentication middleware
 * export async function authenticate(credentials: LoginCredentials) {
 *   const user = await getUserByEmail(credentials.email);
 *   if (!user) {
 *     throw new Error('Invalid credentials');
 *   }
 *
 *   const isValidPassword = await verifyPassword(
 *     credentials.password,
 *     user.hashedPassword
 *   );
 *
 *   if (!isValidPassword) {
 *     throw new Error('Invalid credentials');
 *   }
 *
 *   return user;
 * }
 * ```
 *
 * @param password - The plain text password to verify
 * @param hash - The base64-encoded hash string from storage
 * @returns A promise that resolves to true if password matches, false otherwise
 *
 * @see {@link hashPassword} for password hashing
 * @see {@link timingSafeEqual} for secure comparison implementation
 * @see {@link https://codahale.com/a-lesson-in-timing-attacks/} Understanding Timing Attacks
 *
 * @since 1.0.0
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    const combined = new Uint8Array(
      atob(hash)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const deriveBits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, keyMaterial, 256);
    const newHash = new Uint8Array(deriveBits);

    return timingSafeEqual(storedHash, newHash);
  } catch {
    return false;
  }
}

/**
 * Performs timing-safe equality comparison between two byte arrays.
 *
 * Implements constant-time comparison to prevent timing attacks that could
 * reveal information about the compared values. Essential for secure password
 * verification and other cryptographic operations.
 *
 * @see {@link verifyPassword} for password verification usage
 * @see {@link https://www.chosenplaintext.ca/articles/beginners-guide-constant-time-cryptography.html} Constant-Time Cryptography Guide
 *
 * @since 1.0.0
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}
