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
          <header className="sticky top-0 z-50 flex w-full h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-lg px-4 md:px-6 shadow-xs relative">
            <SidebarTrigger className="-ml-1 text-foreground h-10 w-10 rounded-xl border bg-card hover:bg-muted hover:border-primary/50 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs [&_svg]:h-5 [&_svg]:w-5 flex items-center justify-center" />
            <Separator
              orientation="vertical"
              className="mr-1 h-4 hidden sm:block opacity-60"
            />
            <div className="ml-auto flex items-center gap-2.5">
              <OrderNotificationBell />
              <ThemeToggleContainer
                variant="outline"
                className="h-10 w-10 rounded-xl border bg-card hover:bg-muted hover:border-primary/50 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center"
              />
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
