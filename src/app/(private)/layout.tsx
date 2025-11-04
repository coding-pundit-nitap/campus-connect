import { redirect } from "next/navigation";
import { ReactNode } from "react";

// import PriLayoutContainer from "@/components/wrapper/pri-layout-container";
import { authUtils } from "@/lib/utils/auth.utils.server";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await authUtils.isAuthenticated();
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
