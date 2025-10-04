import { GraduationCap } from "lucide-react";
import { Suspense } from "react";

import SharedSidebar, {
  NavigationItem,
  SidebarHeaderConfig,
} from "@/components/shared/shared-sidebar";

import { SidebarFooter } from "./sidebar-footer";

interface AppSidebarProps {
  navigation: NavigationItem[];
  isLoading?: boolean;
  error?: string | null;
}

export default function AppSidebar({
  navigation,
  isLoading = false,
  error,
}: AppSidebarProps) {
  const headerConfig: SidebarHeaderConfig = {
    title: "Campus Connect",
    subtitle: "NIT Arunachal Pradesh",
    icon: GraduationCap,
    href: "/",
  };

  return (
    <SharedSidebar
      navigation={navigation}
      header={headerConfig}
      isLoading={isLoading}
      errorMessage={error || undefined}
    >
      <Suspense fallback={<div className="mt-auto p-4">Loading...</div>}>
        <SidebarFooter />
      </Suspense>
    </SharedSidebar>
  );
}
