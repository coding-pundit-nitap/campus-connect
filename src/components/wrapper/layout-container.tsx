"use client";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import React from "react";

import { navigationUIService } from "@/lib/utils-functions";
import { authRoutes } from "@/rbac";

import { PubLayout } from "./pub-layout";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function PubLayoutContainer({ children }: LayoutContainerProps) {
  const pathname = usePathname();
  const navigation = navigationUIService.getNavigationItems();

  if (authRoutes.includes(pathname)) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <PubLayout navigation={navigation}>{children}</PubLayout>
    </SessionProvider>
  );
}

export default PubLayoutContainer;
