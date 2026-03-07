import { NextResponse } from "next/server";

import { convertPrismaDecimals } from "./prisma-serializer";

export function jsonResponse<T>(
  body: T,
  status: number = 200
): NextResponse<T> {
  try {
    const normalized = convertPrismaDecimals<T>(body);
    return NextResponse.json(normalized, { status });
  } catch {
    return NextResponse.json(body, { status });
  }
}
