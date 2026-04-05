import Image from "next/image";
import { Suspense } from "react";

import SharedSidebar, {
  NavigationGroup,
  NavigationItem,
  SidebarHeaderConfig,
} from "@/components/shared/shared-sidebar";
import { cn } from "@/lib/cn";

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

  const headerConfig: SidebarHeaderConfig = {
    title: "Campus Connect",
    subtitle: "NIT Arunachal Pradesh",
    icon: SidebarIcon,
    href: "/",
  };

  return (
    <SharedSidebar
      navigation={navigation}
      groups={groups}
      header={headerConfig}
      isLoading={isLoading}
      errorMessage={error || undefined}
    >
      <Suspense fallback={<div className="mt-auto p-4">Loading...</div>}>
        {footer}
      </Suspense>
    </SharedSidebar>
  );
}
