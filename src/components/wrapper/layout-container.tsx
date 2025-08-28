"use client";
import { usePathname } from "next/navigation";
import React from "react";

import { useNavigation } from "@/hooks/useNavigation";

import { Layout } from "./layout";

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function LayoutContainer({ children }: LayoutContainerProps) {
  const pathname = usePathname();
  const { navigation } = useNavigation();

  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return <Layout navigation={navigation}>{children}</Layout>;
}

export default LayoutContainer;
