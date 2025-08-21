import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import userServices from "@/services/user.services";
import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

export const config = {
  runtime: "edge",
};

/**
 * Handles user registration requests via POST method.
 *
 * This API endpoint creates a new user account by validating the provided registration data,
 * checking for existing users with the same email, hashing the password securely, and storing
 * the user information in the database. It returns the created user data (excluding sensitive
 * information) upon successful registration.
 *
 * @param request - The Next.js request object containing the registration data
 * @param request.body - JSON body containing user registration information
 * @param request.body.name - The user's full name
 * @param request.body.email - The user's email address (must be unique)
 * @param request.body.password - The user's plain text password (will be hashed)
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 201: Success response with created user data (id, email, name, role)
 *   - 400: Bad request when input validation fails
 *   - 409: Conflict when user with email already exists
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When user creation fails due to database errors
 *
 * @see {@link registerSchema} for input validation rules
 * @see {@link hashPassword} for password hashing implementation
 * @see {@link userServices.createUser} for user creation service
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = registerSchema.safeParse(body);
    if (!parsedData.success) {
      const errorResponse = createErrorResponse("Invalid input data");
      return NextResponse.json(errorResponse, { status: 400 });
    }
    const { name, email, password } = parsedData.data;
    const existingUser = await userServices.getUserByEmail(email);
    if (existingUser) {
      const errorResponse = createErrorResponse(
        "User with this email already exists.",
      );
      return NextResponse.json(errorResponse, { status: 409 });
    }

    const hashed_password = await hashPassword(password);

    const user = await userServices.createUser(
      {
        name,
        email,
        hashed_password,
      },
      {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    );

    const successResponse = createSuccessResponse(
      user,
      "User registered successfully",
    );
    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred.",
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
