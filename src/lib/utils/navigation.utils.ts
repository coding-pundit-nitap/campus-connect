import {
  Bell,
  CalendarClock,
  HelpCircle,
  Home,
  Info,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  Rss,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { Route } from "next";

import {
  NavigationGroup,
  NavigationItem,
} from "@/components/shared/shared-sidebar";

class NavigationUIService {
  getNavigationItems(): NavigationItem[] {
    return [
      { id: "home", title: "Home", url: "/", icon: Home },
      { id: "shops", title: "Shops", url: "/shops", icon: Store },
      { id: "search", title: "Search", url: "/search", icon: Search },
      { id: "feed", title: "Feed", url: "/feed", icon: Rss },
      { id: "orders", title: "My Orders", url: "/orders", icon: ShoppingBag },
    ];
  }

  getNavigationGroups(): NavigationGroup[] {
    return [
      {
        label: "Discover",
        items: [
          { id: "home", title: "Home", url: "/", icon: Home },
          { id: "shops", title: "Shops", url: "/shops", icon: Store },
          { id: "search", title: "Search", url: "/search", icon: Search },
          {
            id: "feed",
            title: "Deals & Announcements",
            url: "/feed",
            icon: Rss,
          },
        ],
      },
      {
        label: "My Account",
        items: [
          {
            id: "orders",
            title: "My Orders",
            url: "/orders",
            icon: ShoppingBag,
          },
          {
            id: "notifications",
            title: "Notifications",
            url: "/notifications",
            icon: Bell,
          },
        ],
      },
      {
        label: "Information",
        items: [
          { id: "about", title: "About Us", url: "/about", icon: Info },
          { id: "faq", title: "FAQ", url: "/faq", icon: HelpCircle },
          { id: "contact", title: "Contact Us", url: "/contact", icon: Mail },
        ],
      },
    ];
  }

  getProNavigationItems(): NavigationItem[] {
    return [
      { id: "dashboard", title: "Dashboard", url: "/admin", icon: Home },
      { id: "users", title: "Users", url: "/admin/users", icon: Users },
      { id: "shops", title: "Shops", url: "/admin/shops", icon: Store },
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

  getProNavigationGroups(): NavigationGroup[] {
    return [
      {
        label: "Platform",
        items: [
          { id: "dashboard", title: "Dashboard", url: "/admin", icon: Home },
        ],
      },
      {
        label: "Management",
        items: [
          { id: "users", title: "Users", url: "/admin/users", icon: Users },
          { id: "shops", title: "Shops", url: "/admin/shops", icon: Store },
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
        ],
      },
      {
        label: "Communication",
        items: [
          {
            id: "broadcasts",
            title: "Broadcasts",
            url: "/admin/broadcasts",
            icon: Bell,
          },
        ],
      },
      {
        label: "System",
        items: [
          {
            id: "settings",
            title: "Settings",
            url: "/admin/settings",
            icon: Settings,
          },
        ],
      },
    ];
  }

  getOwnerNavigationGroups(): NavigationGroup[] {
    return [
      {
        label: "Operations",
        items: [
          {
            id: "overview",
            title: "Overview",
            url: "/owner-shops",
            icon: LayoutDashboard,
          },
          {
            id: "orders",
            title: "Orders",
            url: "/owner-shops/orders",
            icon: ShoppingBag,
          },
          {
            id: "products",
            title: "Products",
            url: "/owner-shops/products",
            icon: Package,
          },
          {
            id: "announcements",
            title: "Announcements",
            url: "/owner-shops/announcements",
            icon: Megaphone,
          },
        ],
      },
      {
        label: "Delivery",
        items: [
          {
            id: "batch-cards",
            title: "Delivery Schedule",
            url: "/owner-shops/batch-cards",
            icon: CalendarClock,
          },
        ],
      },
      {
        label: "Business",
        items: [
          {
            id: "profile",
            title: "Shop Profile",
            url: "/owner-shops/profile" as Route,
            icon: Store,
          },
          {
            id: "settings",
            title: "Settings",
            url: "/owner-shops/settings",
            icon: Settings,
          },
        ],
      },
    ];
  }
}

export const navigationUIService = new NavigationUIService();

export default navigationUIService;
