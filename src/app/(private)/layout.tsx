import { redirect } from "next/navigation";
import { ReactNode } from "react";

import PubLayoutContainer from "@/components/wrapper/pub-layout-container";
import { authUtils } from "@/lib/utils/auth.utils.server";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await authUtils.isAuthenticated();
  } catch {
    redirect("/");
  }

  return <PubLayoutContainer>{children}</PubLayoutContainer>;
}
