import { NextResponse } from "next/server";

import authUtils from "@/lib/utils/auth.utils.server";
import { userRepository } from "@/repositories";
import { updateUserSchema } from "@/validations/user.validation";

export async function GET() {
  try {
    const user = await authUtils.getUserData();

    const userWithAddress = await userRepository.findByEmail(user.email!, {
      include: { addresses: true },
    });

    return NextResponse.json(userWithAddress, { status: 200 });
  } catch (error) {
    console.error("[USER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
