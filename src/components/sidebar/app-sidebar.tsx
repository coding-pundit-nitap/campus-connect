import { GraduationCap } from "lucide-react";
import { Suspense } from "react";

import SharedSidebar, {
  NavigationGroup,
  NavigationItem,
  SidebarHeaderConfig,
} from "@/components/shared/shared-sidebar";

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
  const headerConfig: SidebarHeaderConfig = {
    title: "Campus Connect",
    subtitle: "NIT Arunachal Pradesh",
    icon: GraduationCap,
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
