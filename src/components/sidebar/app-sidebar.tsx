import { GraduationCap } from "lucide-react";

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
    title: "College Connect",
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
      <SidebarFooter />
    </SharedSidebar>
  );
}
