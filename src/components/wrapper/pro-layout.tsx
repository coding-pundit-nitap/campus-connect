import { ArrowLeft } from "lucide-react";
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
          <header className="sticky top-0 z-50 flex w-full h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-md px-4 supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="ml-auto flex items-center gap-2">
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
