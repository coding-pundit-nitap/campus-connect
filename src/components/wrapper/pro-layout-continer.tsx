"use client";
import React from "react";

import { navigationUIService } from "@/lib/utils";

import { ProLayout } from "./pro-layout";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function ProLayoutContainer({ children }: LayoutContainerProps) {
  const groups = navigationUIService.getProNavigationGroups();

  return (
    <>
      <ProLayout groups={groups}>{children}</ProLayout>
    </>
  );
}

export default ProLayoutContainer;
