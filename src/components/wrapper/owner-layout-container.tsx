import React from "react";

import { OwnerProvider } from "@/components/owned-shop/owner-context";

import { OwnerLayout } from "./owner-layout";

interface OwnerLayoutContainerProps {
  children: React.ReactNode;
}

export function OwnerLayoutContainer({ children }: OwnerLayoutContainerProps) {
  return (
    <OwnerProvider>
      <OwnerLayout>{children}</OwnerLayout>
    </OwnerProvider>
  );
}

export default OwnerLayoutContainer;
