import { NextResponse } from "next/server";

import { userRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import { updateUserSchema } from "@/validations/user.validation";
const log = createLogger("route");

export async function GET() {
  try {
    const user = await authUtils.getUserData();

    const userWithAddress = await userRepository.findByEmail(user.email!, {
      include: { addresses: true },
    });

    return jsonResponse(userWithAddress, 200);
  } catch (error) {
    log.error({ err: error }, "[USER_GET]");
    return jsonResponse({ error: "Internal error" }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const user_id = await authUtils.getUserId();

    const body = await req.json();

    const validatedFields = updateUserSchema.safeParse(body);

    if (!validatedFields.success) {
      return new NextResponse("Invalid fields", { status: 400 });
    }

    const updatedUser = await userRepository.update(
      user_id,
      validatedFields.data
    );

    return jsonResponse(updatedUser, 200);
  } catch (error) {
    log.error({ err: error }, "[USER_UPDATE]");
    return jsonResponse({ error: "Internal error" }, 500);
  }
}
