import { NextRequest, NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import userRepository from "@/repositories/user.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { registerSchema } from "@/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = registerSchema.safeParse(body);
    if (!parsedData.success) {
      const errorResponse = createErrorResponse("Invalid input data");
      return NextResponse.json(errorResponse, { status: 400 });
    }
    const { name, email, password } = parsedData.data;
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const errorResponse = createErrorResponse(
        "User with this email already exists."
      );
      return NextResponse.json(errorResponse, { status: 409 });
    }

    const hash_password = await hashPassword(password);

    const user = await userRepository.create({
      data: {
        name,
        email,
        hash_password,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

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
