import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import React from "react";
import { Toaster } from "sonner";

import ThemeToggleContainer from "@/components/navigation/theme-toggle-container";
import {
  NavigationGroup,
  NavigationItem,
} from "@/components/shared/shared-sidebar";
import AppSidebar from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Button } from "../ui/button";

interface LayoutProps {
  children: React.ReactNode;
  navigation?: NavigationItem[];
  groups?: NavigationGroup[];
  isNavigationLoading?: boolean;
  navigationError?: string;
}
const OrderNotificationBell = dynamic(
  () =>
    import("../notification/notification-bell").then(
      (mod) => mod.OrderNotificationBell
    ),
  { ssr: false }
);
export function ProLayout({
  children,
  navigation,
  groups,
  isNavigationLoading = false,
  navigationError,
}: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        navigation={navigation}
        groups={groups}
        isLoading={isNavigationLoading}
        error={navigationError}
        footer={
          <Button variant="outline" className="w-full p-0" asChild>
            <Link href="/" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Main Page</span>
              </div>
            </Link>
          </Button>
        }
      />
      <SidebarInset>
        <div className="flex flex-col items-center justify-center w-full min-h-screen">
          <header className="sticky top-0 z-50 flex w-full h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-lg px-4 md:px-6 shadow-xs relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-blue-600 before:to-orange-500 before:z-50">
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
