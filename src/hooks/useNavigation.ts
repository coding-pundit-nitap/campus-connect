"use client";
import { HelpCircle, Home, Settings, ShoppingBag, Store } from "lucide-react";
import { useMemo } from "react";

import { NavigationItem } from "@/components/shared/shared-sidebar";

export function useNavigation() {
  const navigation: NavigationItem[] = useMemo(
    () => [
      {
        id: "home",
        title: "Home",
        url: "/",
        icon: Home,
      },
      {
        id: "checkout",
        title: "Checkout",
        url: "/checkout",
        icon: ShoppingBag,
      },
      {
        id: "shops",
        title: "Shops",
        url: "/shops",
        icon: Store,
      },
      {
        id: "orders",
        title: "My Orders",
        url: "/orders",
        icon: ShoppingBag,
      },
      {
        id: "settings",
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
      {
        id: "help",
        title: "Help",
        url: "/help",
        icon: HelpCircle,
      },
    ],
    []
  );

  return {
    navigation,
  };
}
