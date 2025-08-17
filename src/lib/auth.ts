/**
 * Authentication utility module for the college connect application.
 *
 * This module provides secure password hashing, verification, and error handling
 * utilities for authentication workflows. It implements industry-standard security
 * practices including PBKDF2 key derivation, random salt generation, and timing-safe
 * comparison to prevent timing attacks.
 *
 * @example
 * ```typescript
 * // Hash a password for storage
 * const hashedPassword = await hashPassword('userPassword123');
 *
 * // Verify password during login
 * const isValid = await verifyPassword('userPassword123', hashedPassword);
 * ```
 *
 * @remarks
 * **Security Features:**
 * - PBKDF2 with SHA-256 for key derivation
 * - 100,000 iterations for computational cost
 * - 16-byte random salt per password
 * - Timing-safe comparison to prevent timing attacks
 * - Base64 encoding for storage compatibility
 *
 * @see {@link https://noble.js.org/} Noble cryptography library
 * @see {@link https://tools.ietf.org/html/rfc2898} PBKDF2 RFC specification
 *
 * @since 1.0.0
 */
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha2";

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
 * @remarks
 * **Error Type Handling:**
 * - **Error objects:** Extracts the message property
 * - **String errors:** Returns the string directly
 * - **Unknown types:** Logs to console and returns default message
 *
 * **Security Considerations:**
 * - Avoid exposing sensitive system information in error messages
 * - Use generic messages for production environments
 * - Log detailed errors for debugging purposes
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
 * @remarks
 * **Security Specifications:**
 * - **Algorithm:** PBKDF2 with SHA-256
 * - **Salt:** 16 bytes of cryptographically random data
 * - **Iterations:** 100,000 (meets OWASP recommendations)
 * - **Key Length:** 32 bytes (256 bits)
 * - **Encoding:** Base64 for database compatibility
 *
 * **Storage Format:**
 * The returned string contains both salt and hash concatenated and base64-encoded.
 * This eliminates the need for separate salt storage and simplifies verification.
 *
 * **Performance Considerations:**
 * - Hashing is intentionally slow (100,000 iterations)
 * - Consider using web workers for client-side hashing
 * - Cache results appropriately to avoid repeated hashing
 *
 * @throws {Error} When crypto.getRandomValues is not available
 *
 * @see {@link verifyPassword} for password verification
 * @see {@link https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html} OWASP Password Storage Guidelines
 *
 * @since 1.0.0
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = pbkdf2(sha256, password, salt, { c: 100000, dkLen: 32 });

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
 * @remarks
 * **Security Features:**
 * - **Timing-safe comparison:** Prevents timing attacks
 * - **Salt extraction:** Automatically extracts salt from stored hash
 * - **Error handling:** Returns false for any verification errors
 * - **Constant-time operation:** Comparison time doesn't leak information
 *
 * **Verification Process:**
 * 1. Decode the base64 hash to extract salt and stored hash
 * 2. Hash the provided password with the extracted salt
 * 3. Compare the new hash with the stored hash using timing-safe comparison
 * 4. Return true only if hashes match exactly
 *
 * **Error Handling:**
 * Returns false for any error during verification process, including:
 * - Invalid base64 encoding
 * - Corrupted hash format
 * - Cryptographic errors
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

    const newHash = pbkdf2(sha256, password, salt, { c: 100000, dkLen: 32 });

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
 * @example
 * ```typescript
 * // Compare cryptographic hashes safely
 * const hash1 = new Uint8Array([1, 2, 3, 4]);
 * const hash2 = new Uint8Array([1, 2, 3, 4]);
 * const isEqual = timingSafeEqual(hash1, hash2); // true
 * ```
 *
 * @param a - First byte array to compare
 * @param b - Second byte array to compare
 * @returns True if arrays are identical, false otherwise
 *
 * @remarks
 * **Security Properties:**
 * - **Constant-time execution:** Comparison time doesn't vary based on input
 * - **No early termination:** Processes all bytes regardless of differences
 * - **Timing attack resistance:** Prevents information leakage through timing
 *
 * **Implementation Details:**
 * - Uses bitwise XOR to compare all bytes
 * - Accumulates differences without early exit
 * - Returns true only when accumulated result is zero
 * - Handles different array lengths securely
 *
 * **Use Cases:**
 * - Password hash verification
 * - HMAC verification
 * - Token comparison
 * - Any cryptographic equality check
 *
 * @internal This function is used internally by verifyPassword
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
