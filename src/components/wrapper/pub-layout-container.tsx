"use client";
import { usePathname } from "next/navigation";
import React from "react";

import { navigationUIService } from "@/lib/utils";
import { authRoutes } from "@/rbac";

import { PubLayout } from "./pub-layout";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function PubLayoutContainer({ children }: LayoutContainerProps) {
  const pathname = usePathname();
  const navigation = navigationUIService.getNavigationItems();

  if (authRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <PubLayout navigation={navigation}>{children}</PubLayout>
    </>
  );
}

export default PubLayoutContainer;
