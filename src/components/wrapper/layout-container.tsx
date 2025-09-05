"use client";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import React from "react";

import { navigationUIService } from "@/lib/utils-functions";
import { authRoutes } from "@/rbac";

import { Layout } from "./layout";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function LayoutContainer({ children }: LayoutContainerProps) {
  const pathname = usePathname();
  const navigation = navigationUIService.getNavigationItems();

  if (authRoutes.includes(pathname)) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <Layout navigation={navigation}>{children}</Layout>
    </SessionProvider>
  );
}

export default LayoutContainer;
