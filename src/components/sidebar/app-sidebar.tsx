"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import SharedSidebar, {
  NavigationGroup,
  NavigationItem,
  SidebarHeaderConfig,
} from "@/components/shared/shared-sidebar";
import { cn } from "@/lib/cn";
import { navigationUIService } from "@/lib/utils";

import { OwnerSidebarFooter } from "./owner-sidebar-footer";
import { ShopkeeperSidebarHeader } from "./shopkeeper-sidebar-header";

interface AppSidebarProps {
  navigation?: NavigationItem[];
  groups?: NavigationGroup[];
  isLoading?: boolean;
  error?: string | null;
  footer: React.ReactNode;
}

export default function AppSidebar({
  navigation,
  groups,
  isLoading = false,
  error,
  footer,
}: AppSidebarProps) {
  const pathname = usePathname();
  const isOwnerRoute = pathname.startsWith("/owner-shops");

  const SidebarIcon = ({ className }: { className?: string }) => (
    <Image
      src="/icon.svg"
      alt="Campus Connect"
      width={30}
      height={30}
      className={cn("rounded-sm", className)}
      style={{ width: "30px", height: "30px" }}
    />
  );

  const defaultHeaderConfig: SidebarHeaderConfig = {
    title: "Campus Connect",
    subtitle: "NIT Arunachal Pradesh",
    icon: SidebarIcon,
    href: "/",
  };

  const headerConfig: SidebarHeaderConfig = isOwnerRoute
    ? {
        title: "",
        customContent: <ShopkeeperSidebarHeader />,
      }
    : defaultHeaderConfig;

  const activeGroups = isOwnerRoute
    ? navigationUIService.getOwnerNavigationGroups()
    : groups;

  const activeFooter = isOwnerRoute ? <OwnerSidebarFooter /> : footer;

  return (
    <SharedSidebar
      navigation={isOwnerRoute ? undefined : navigation}
      groups={activeGroups}
      header={headerConfig}
      isLoading={isLoading}
      errorMessage={error || undefined}
    >
      <Suspense
        fallback={
          <div className="mt-auto p-4 text-xs text-muted-foreground">
            Loading...
          </div>
        }
      >
        {activeFooter}
      </Suspense>
    </SharedSidebar>
  );
}
