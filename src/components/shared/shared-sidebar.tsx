"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import type { UrlObject } from "url";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Configuration interface for navigation items in the sidebar.
 *
 * @interface NavigationItem
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;
  /** The display text for the navigation item */
  title: string;
  /** The URL/route that the navigation item links to */
  url: Route;
  /** React component or icon to display alongside the navigation item */
  icon: React.ComponentType<{ className?: string }>;
  /** Optional badge content (text or number) to display on the navigation item */
  badge?: string | number;
  /** Visual variant for the badge styling */
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
  /** Whether this navigation item is disabled */
  disabled?: boolean;
  /** Optional external link indicator */
  external?: boolean;
}

/**
 * Configuration interface for the sidebar header section.
 *
 * @interface SidebarHeaderConfig
 */
export interface SidebarHeaderConfig {
  /** Main title text displayed in the header */
  title: string;
  /** Optional subtitle text displayed below the main title */
  subtitle?: string;
  /** Optional icon component to display in the header */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional URL to make the header clickable */
  href?: Route;
  /** Custom React content to replace the default header layout */
  customContent?: ReactNode;
}

/**
 * Props interface for the SharedSidebar component.
 *
 * @interface SharedSidebarProps
 */
export interface SharedSidebarProps {
  /** Array of navigation items to display in the sidebar */
  navigation: NavigationItem[];
  /** Optional header configuration for the sidebar */
  header?: SidebarHeaderConfig;
  /** Additional CSS classes to apply to the sidebar container */
  className?: string;
  /** Whether to show the header section */
  showHeader?: boolean;
  /** CSS classes to apply to active navigation items */
  activeClassName?: string;
  /** Optional children components to render at the bottom of the sidebar */
  children?: ReactNode;
  /** Add loading state */
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
}

export default function SharedSidebar({
  navigation,
  header,
  className = "",
  showHeader = true,
  activeClassName = "",
  children,
  isLoading = false,
  loadingComponent,
  errorMessage,
  onRetry,
}: SharedSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const normalizeUrl = (url: Route | UrlObject): string => {
    if (typeof url === "string") {
      return url;
    }
    return (url as UrlObject).pathname || "/";
  };

  const isItemActive = (
    url: Route | UrlObject,
    currentPath: string
  ): boolean => {
    const normalizedUrl = normalizeUrl(url);

    if (normalizedUrl === "/") {
      return currentPath === "/";
    }
    if (normalizedUrl === "/admin") {
      return currentPath === "/admin";
    }

    return currentPath.startsWith(normalizedUrl);
  };

  const Header = () => {
    if (!showHeader || !header) return null;

    if (header.customContent) {
      return <SidebarHeader>{header.customContent}</SidebarHeader>;
    }

    const HeaderIcon = header.icon;
    const content = (
      <>
        {HeaderIcon && (
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <HeaderIcon className="size-4" />
          </div>
        )}
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{header.title}</span>
          {header.subtitle && (
            <span className="truncate text-xs">{header.subtitle}</span>
          )}
        </div>
      </>
    );

    return (
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              size="lg"
              asChild
            >
              {header.href ? (
                <Link href={header.href}>{content}</Link>
              ) : (
                <div className="flex items-center gap-2">{content}</div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  };

  const Item = (item: NavigationItem) => {
    const ItemIcon = item.icon;
    const isActive = isItemActive(item.url, pathname);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
          className={isActive ? activeClassName : ""}
          onClick={() => setOpenMobile(false)}
        >
          <Link
            href={item.url as Route}
            className="flex items-center justify-between"
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="flex items-center gap-2">
              <ItemIcon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.external && (
                <span className="sr-only">(opens in new tab)</span>
              )}
            </div>
            {item.badge && (
              <Badge
                variant={item.badgeVariant || "destructive"}
                className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                aria-label={`${item.title} has ${item.badge} items`}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  if (isLoading) {
    return (
      <Sidebar className={className}>
        {Header()}
        <SidebarContent>
          {loadingComponent || (
            <div className="flex items-center justify-center p-4">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    );
  }

  if (errorMessage) {
    return (
      <Sidebar className={className}>
        {Header()}
        <SidebarContent>
          <div className="flex flex-col items-center justify-center p-4 space-y-2">
            <span className="text-destructive text-sm">{errorMessage}</span>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try Again
              </Button>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={className}>
      {Header()}
      <SidebarContent className="flex flex-col justify-between p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item, index) => (
                <Item key={index} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {children}
      </SidebarContent>
    </Sidebar>
  );
}
