"use client";
import { GraduationCap } from "lucide-react";

import SharedSidebar, {
  NavigationItem,
  SidebarHeaderConfig,
} from "@/components/shared/shared-sidebar";

type Props = {
  navigation: NavigationItem[];
};

export default function AppSidebar({ navigation }: Props) {
  const headerConfig: SidebarHeaderConfig = {
    title: "College Connect",
    subtitle: "Nit Arunachal Pradesh",
    icon: GraduationCap,
    href: "/",
  };

  return <SharedSidebar navigation={navigation} header={headerConfig} />;
}
