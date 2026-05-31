"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Toaster } from "sonner";

import ThemeToggleContainer from "@/components/navigation/theme-toggle-container";
import AppSidebar from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface OwnerLayoutProps {
  children: React.ReactNode;
}
const OrderNotificationBell = dynamic(
  () =>
    import("../notification/notification-bell").then(
      (mod) => mod.OrderNotificationBell
    ),
  { ssr: false }
);
export function OwnerLayout({ children }: OwnerLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar footer={null} />
      <SidebarInset>
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-sidebar-background/5">
          <header className="sticky top-0 z-50 flex w-full h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-md px-4 supports-backdrop-filter:bg-background/60">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="ml-auto flex items-center gap-2">
              <OrderNotificationBell />
              <ThemeToggleContainer />
            </div>
          </header>
          <main className="flex flex-1 p-4 flex-col w-full overflow-y-auto bg-background/30">
            {children}
            <Toaster
              className="z-50"
              position="top-right"
              richColors
              closeButton
            />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
