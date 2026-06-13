import dynamic from "next/dynamic";
import React from "react";
import { Toaster } from "sonner";

import SearchBarContainer from "@/components/navigation/search-bar-container";
import ThemeToggleContainer from "@/components/navigation/theme-toggle-container";
import { Footer } from "@/components/shared/footer";
import { NavigationGroup } from "@/components/shared/shared-sidebar";
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

const CartDrawer = dynamic(
  () => import("@/components/cart-drawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);

interface LayoutProps {
  children: React.ReactNode;
  groups?: NavigationGroup[];
  isNavigationLoading?: boolean;
  navigationError?: string;
}

export function PubLayout({
  children,
  groups,
  isNavigationLoading = false,
  navigationError,
}: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        groups={groups}
        isLoading={isNavigationLoading}
        error={navigationError}
        footer={<SidebarFooter />}
      />
      <SidebarInset>
        <div className="flex flex-col items-center justify-center w-full min-h-screen">
          <header className="sticky top-0 z-50 flex w-full h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-lg px-4 md:px-6 shadow-xs relative ">
            <SidebarTrigger className="-ml-1 text-foreground h-10 w-10 rounded-xl border bg-card hover:bg-muted hover:border-primary/50 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs [&_svg]:h-5 [&_svg]:w-5 flex items-center justify-center" />
            <Separator
              orientation="vertical"
              className="mr-1 h-4 hidden sm:block opacity-60"
            />
            <SearchBarContainer className="flex-1 max-w-[200px] xs:max-w-xs sm:max-w-md md:max-w-lg transition-all duration-300 [&_input]:rounded-xl [&_input]:border-2 [&_input]:bg-muted/30 focus-within:[&_input]:bg-background focus-within:[&_input]:border-primary/80 [&_input]:transition-all [&_input]:duration-200" />
            <div className="ml-auto flex items-center gap-2.5">
              <OrderNotificationBell />
              <CartDrawer />
              <ThemeToggleContainer
                variant="outline"
                className="h-10 w-10 rounded-xl border bg-card hover:bg-muted hover:border-primary/50 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center"
              />
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
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
