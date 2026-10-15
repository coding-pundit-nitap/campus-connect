import { unauthorized } from "next/navigation";
import { ReactNode } from "react";

import ProLayoutContainer from "@/components/wrapper/pro-layout-continer";
import authUtils from "@/lib/utils/auth.utils.server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  let isAdmin = false;
  try {
    isAdmin = await authUtils.isAdmin();
  } catch {
    // Signed out or session lookup failed: treated as not an admin.
  }
  if (!isAdmin) unauthorized();

  return <ProLayoutContainer>{children}</ProLayoutContainer>;
}
