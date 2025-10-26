import { headers } from "next/headers";
import React from "react";

import { auth } from "@/auth";

import LoginIndicator from "./login-indicator";

export default async function AuthWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.id) {
    return <LoginIndicator />;
  }
  return <>{children}</>;
}
