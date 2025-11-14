import {
  Bell,
  Home,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";

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
  getProNavigationItems(): NavigationItem[] {
    return [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/admin",
        icon: Home,
      },
      {
        id: "users",
        title: "Users",
        url: "/admin/users",
        icon: Users,
      },
      {
        id: "shops",
        title: "Shops",
        url: "/admin/shops",
        icon: Store,
      },
      {
        id: "products",
        title: "Products",
        url: "/admin/products",
        icon: Package,
      },
      {
        id: "orders",
        title: "Orders",
        url: "/admin/orders",
        icon: ShoppingBag,
      },
      {
        id: "broadcasts",
        title: "Broadcasts",
        url: "/admin/broadcasts",
        icon: Bell,
      },
      {
        id: "settings",
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
      },
    ];
  }
}

export const navigationUIService = new NavigationUIService();

export default navigationUIService;
