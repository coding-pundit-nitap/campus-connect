"use client";
import React from "react";

import { navigationUIService } from "@/lib/utils";

import { ProLayout } from "./pro-layout";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function ProLayoutContainer({ children }: LayoutContainerProps) {
  const navigation = navigationUIService.getProNavigationItems();

  return (
    <>
      <ProLayout navigation={navigation}>{children}</ProLayout>
    </>
  );
}

export default ProLayoutContainer;
