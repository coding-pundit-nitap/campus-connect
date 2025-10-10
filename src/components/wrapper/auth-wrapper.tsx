import React from "react";

import { getCachedSession } from "@/lib/session";

import LoginIndicator from "./login-indicator";

export default async function AuthWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCachedSession();
  if (!session?.user.id) {
    return <LoginIndicator />;
  }
  return <>{children}</>;
}
