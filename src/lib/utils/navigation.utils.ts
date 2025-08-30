import { NavigationItem } from "@/components/shared/shared-sidebar";

class NavigationUIService {
  static getNavigationItems(): NavigationItem[] {
    return [
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
    ];
  }
}

const navigationUIService = new NavigationUIService();

export default navigationUIService;
