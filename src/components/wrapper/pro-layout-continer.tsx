"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";

import { navigationUIService } from "@/lib/utils-functions";

import { ProLayout } from "./pro-layout";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function ProLayoutContainer({ children }: LayoutContainerProps) {
  const navigation = navigationUIService.getProNavigationItems();

  return (
    <SessionProvider>
      <ProLayout navigation={navigation}>{children}</ProLayout>
    </SessionProvider>
  );
}

export default ProLayoutContainer;
