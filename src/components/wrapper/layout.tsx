import React from "react";

import { CartDrawer } from "@/components/cart-drawer";
import SearchBar from "@/components/navigation/search-bar";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import AppSidebar from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar navigation={[]} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 text-foreground" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <SearchBar />
          <div className="ml-auto flex items-center gap-2">
            <CartDrawer />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
