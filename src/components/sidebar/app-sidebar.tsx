"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import SharedSidebar, {
  NavigationGroup,
  NavigationItem,
  SidebarHeaderConfig,
} from "@/components/shared/shared-sidebar";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/query-keys";
import { navigationUIService } from "@/lib/utils";
import { vendorApiService } from "@/services";

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

  const { data: orderConsoleData } = useQuery({
    queryKey: queryKeys.batch.orderConsole(),
    queryFn: vendorApiService.getOrderConsoleData,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 30000,
    enabled: isOwnerRoute,
  });

  const newOrderCount =
    isOwnerRoute && orderConsoleData
      ? [
          ...(orderConsoleData.batchOrders || []),
          ...(orderConsoleData.directOrders || []),
        ].filter((o) => o.order_status === "NEW").length
      : 0;

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

  const ownerGroups = isOwnerRoute
    ? navigationUIService.getOwnerNavigationGroups().map((group) => {
        if (group.label === "Operations") {
          return {
            ...group,
            items: group.items.map((item) => {
              if (item.id === "overview" && newOrderCount > 0) {
                return {
                  ...item,
                  badge: newOrderCount > 9 ? "9+" : newOrderCount,
                  badgeVariant: "default" as const,
                };
              }
              return item;
            }),
          };
        }
        return group;
      })
    : [];

  const activeGroups = isOwnerRoute ? ownerGroups : groups;

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
