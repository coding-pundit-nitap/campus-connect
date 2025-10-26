import { unauthorized } from "next/navigation";
import { ReactNode } from "react";

import ProLayoutContainer from "@/components/wrapper/pro-layout-continer";
import authUtils from "@/lib/utils/auth.utils";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await authUtils.isAdmin();
  } catch {
    unauthorized();
  }

  return <ProLayoutContainer>{children}</ProLayoutContainer>;
}
