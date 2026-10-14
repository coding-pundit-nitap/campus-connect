import { describe, expect, it } from "vitest";

import type {
  NavigationGroup as Group,
  NavigationItem as Item,
} from "@/components/shared/shared-sidebar";

import navigationUIService, {
  navigationUIService as named,
} from "./navigation.utils";

const flatten = (groups: Group[]) => groups.flatMap((g) => g.items);

describe("navigationUIService", () => {
  it("exports one singleton", () => {
    expect(navigationUIService).toBe(named);
  });

  it.each<[string, () => Item[], string[]]>([
    [
      "customer items",
      () => navigationUIService.getNavigationItems(),
      ["/", "/shops", "/search", "/feed", "/orders"],
    ],
    [
      "admin items",
      () => navigationUIService.getProNavigationItems(),
      [
        "/admin",
        "/admin/users",
        "/admin/shops",
        "/admin/products",
        "/admin/orders",
        "/admin/broadcasts",
        "/admin/settings",
      ],
    ],
  ])("%s link to the expected routes", (_label, get, urls) => {
    const items = get();

    expect(items.map((i) => i.url)).toEqual(urls);
    for (const item of items) expect(item.icon).toBeDefined();
  });

  it.each<[string, () => Group[], string[]]>([
    [
      "customer groups",
      () => navigationUIService.getNavigationGroups(),
      ["Discover", "My Account"],
    ],
    [
      "admin groups",
      () => navigationUIService.getProNavigationGroups(),
      ["Platform", "Management", "Communication", "System"],
    ],
    [
      "owner groups",
      () => navigationUIService.getOwnerNavigationGroups(),
      ["Operations", "Delivery", "Business"],
    ],
  ])("%s are labelled in order with unique ids", (_label, get, labels) => {
    const groups = get();
    const ids = flatten(groups).map((i) => i.id);

    expect(groups.map((g) => g.label)).toEqual(labels);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every owner route under /owner-shops", () => {
    const urls = flatten(navigationUIService.getOwnerNavigationGroups()).map(
      (i) => i.url
    );

    for (const url of urls) expect(url).toMatch(/^\/owner-shops/);
  });
});
