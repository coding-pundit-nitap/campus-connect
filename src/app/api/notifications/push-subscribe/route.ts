import { NextRequest } from "next/server";

import { UnauthenticatedError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";

const log = createLogger("push-subscribe");

export async function POST(req: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return new Response("Invalid subscription format", { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return new Response("Invalid subscription keys", { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        user_id,
        p256dh,
        auth,
      },
      create: {
        user_id,
        endpoint,
        p256dh,
        auth,
      },
    });

    log.info({ userId: user_id, endpoint }, "Push subscription saved");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return new Response("Unauthorized", { status: 401 });
    }

    log.error({ err: error }, "Failed to save push subscription");
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return new Response("Missing endpoint", { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, user_id },
    });

    log.info({ userId: user_id, endpoint }, "Push subscription deleted");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return new Response("Unauthorized", { status: 401 });
    }

    log.error({ err: error }, "Failed to delete push subscription");
    return new Response("Internal Server Error", { status: 500 });
  }
}
