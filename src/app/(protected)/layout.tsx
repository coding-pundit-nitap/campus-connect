import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { auth } from "@/auth";
import ProLayoutContainer from "@/components/wrapper/pro-layout-continer";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/?error=unauthorized");
  }

  return <ProLayoutContainer>{children}</ProLayoutContainer>;
}
