import { NextRequest } from "next/server";

import { errorJson } from "@/app/api/_lib/route-helpers";

/** Password registration is retired; accounts are created via Google sign-in. */
export async function POST(request: NextRequest) {
  void request;
  return errorJson(
    "Registration is disabled. Please use Google sign-in from the login dialog.",
    410
  );
}
