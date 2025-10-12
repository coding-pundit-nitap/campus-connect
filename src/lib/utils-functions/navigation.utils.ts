import { Home, ShoppingBag, Store } from "lucide-react";

import { NavigationItem } from "@/components/shared/shared-sidebar";

class NavigationUIService {
  getNavigationItems(): NavigationItem[] {
    return [
      {
        id: "home",
        title: "Home",
        url: "/",
        icon: Home,
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
    ];
  }
}

export const navigationUIService = new NavigationUIService();

export default navigationUIService;
