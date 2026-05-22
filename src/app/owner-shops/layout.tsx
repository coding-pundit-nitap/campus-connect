import { redirect } from "next/navigation";
import { ReactNode } from "react";

import OwnerLayoutContainer from "@/components/wrapper/owner-layout-container";
import { authUtils } from "@/lib/utils/auth.utils.server";

export default async function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user = null;
  try {
    user = await authUtils.getUserData();
  } catch {
    user = null;
  }

  if (!user) {
    redirect("/");
  }

  if (!user.shop_id) {
    redirect("/create-shop");
  }

  return <OwnerLayoutContainer>{children}</OwnerLayoutContainer>;
}
