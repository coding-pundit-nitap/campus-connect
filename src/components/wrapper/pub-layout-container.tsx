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
  const groups = navigationUIService.getNavigationGroups();

  if (authRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <PubLayout groups={groups}>{children}</PubLayout>
    </>
  );
}

export default PubLayoutContainer;
