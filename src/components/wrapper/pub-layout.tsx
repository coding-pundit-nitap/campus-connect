import dynamic from "next/dynamic";
import React from "react";
import { Toaster } from "sonner";

import { CartDrawer } from "@/components/cart-drawer";
import SearchBarContainer from "@/components/navigation/search-bar-container";
import ThemeToggleContainer from "@/components/navigation/theme-toggle-container";
import { NavigationItem } from "@/components/shared/shared-sidebar";
import AppSidebar from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { SidebarFooter } from "../sidebar/sidebar-footer";

const OrderNotificationBell = dynamic(
  () =>
    import("../notification/notification-bell").then(
      (mod) => mod.OrderNotificationBell
    ),
  { ssr: false }
);

interface LayoutProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  isNavigationLoading?: boolean;
  navigationError?: string;
}

export function PubLayout({
  children,
  navigation,
  isNavigationLoading = false,
  navigationError,
}: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        navigation={navigation}
        isLoading={isNavigationLoading}
        error={navigationError}
        footer={<SidebarFooter />}
      />
      <SidebarInset>
        <div className="flex flex-col items-center justify-center w-full h-screen">
          <header className="flex w-full h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <SearchBarContainer />
            <div className="ml-auto flex items-center gap-2">
              <OrderNotificationBell />
              <CartDrawer />
              <ThemeToggleContainer />
            </div>
          </header>
          <main className="flex flex-1 p-4 flex-col w-full overflow-y-auto">
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
