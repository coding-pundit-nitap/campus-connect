import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import userServices from "@/services/user.services";
import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

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
        "User with this email already exists."
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
      }
    );

    const successResponse = createSuccessResponse(
      user,
      "User registered successfully"
    );
    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
