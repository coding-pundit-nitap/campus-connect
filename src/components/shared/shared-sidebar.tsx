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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/cn";

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
 * Configuration for a group of navigation items.
 *
 * @interface NavigationGroup
 */
export interface NavigationGroup {
  /** Optional title for the group */
  label?: string;
  /** List of navigation items in this group */
  items: NavigationItem[];
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
  /** Array of navigation items to display in the sidebar (flat list) */
  navigation?: NavigationItem[];
  /** Array of navigation groups to display groupings */
  groups?: NavigationGroup[];
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
  navigation = [],
  groups = [],
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
  const displayGroups: NavigationGroup[] =
    groups.length > 0
      ? groups
      : navigation.length > 0
        ? [{ items: navigation, label: "" }]
        : [];

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
    if (!showHeader || !header) {
      return null;
    }

    if (header.customContent) {
      return (
        <SidebarHeader className="p-4 border-b border-border/50">
          {header.customContent}
        </SidebarHeader>
      );
    }

    const HeaderIcon = header.icon;
    const content = (
      <>
        {HeaderIcon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-xs">
            <HeaderIcon className="w-5 h-5" />
          </div>
        )}
        <div className="grid flex-1 text-left leading-tight">
          <span className="truncate font-heading font-black tracking-tight text-foreground text-sm leading-none">
            {header.title}
          </span>
          {header.subtitle && (
            <span className="truncate text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mt-1 leading-none">
              {header.subtitle}
            </span>
          )}
        </div>
      </>
    );

    return (
      <SidebarHeader className="p-4 border-b border-border/40 mb-3 bg-muted/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenMobile(false)}
              size="lg"
              asChild
              className="hover:bg-primary/5 active:scale-[0.99] transition-all duration-200 rounded-xl h-12"
            >
              {header.href ? (
                <Link
                  href={header.href}
                  className="flex items-center gap-3 w-full"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 w-full">{content}</div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  };

  const Item = ({ item }: { item: NavigationItem }) => {
    const ItemIcon = item.icon;
    const isActive = isItemActive(item.url, pathname);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
          className={cn(
            "transition-all duration-200 hover:scale-[1.02] active:scale-98 font-bold border-2 border-transparent rounded-xl h-10 px-3",
            isActive
              ? "bg-primary text-primary-foreground border-primary shadow-[2.5px_2.5px_0px_0px_#F97316] hover:bg-primary hover:text-primary-foreground font-black"
              : "hover:bg-muted hover:text-foreground text-muted-foreground",
            activeClassName
          )}
          onClick={() => setOpenMobile(false)}
        >
          <Link
            href={item.url as Route}
            className="flex items-center justify-between w-full"
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="flex items-center gap-2.5">
              <ItemIcon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  isActive ? "scale-110" : "opacity-80"
                )}
              />
              <span className="text-[13px] tracking-tight">{item.title}</span>
              {item.external && (
                <span className="sr-only">(opens in new tab)</span>
              )}
            </div>
            {item.badge && (
              <Badge
                variant={item.badgeVariant || "destructive"}
                className={cn(
                  "ml-auto h-5 px-1.5 min-w-5 flex items-center justify-center text-[10px] font-bold rounded-md border-none",
                  isActive
                    ? "bg-orange-500 text-white dark:bg-orange-600"
                    : "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                )}
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
    <Sidebar
      className={cn(
        "border-r border-border/60 bg-sidebar/85 backdrop-blur-md",
        className
      )}
    >
      {Header()}
      <SidebarContent className="px-2 space-y-1">
        {displayGroups.map((group, index) => (
          <SidebarGroup key={group.label || index}>
            {group.label && (
              <SidebarGroupLabel className="font-heading font-black uppercase tracking-wider text-[10px] text-muted-foreground/85 px-3 mb-2 mt-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, itemIndex) => (
                  <Item key={item.id || itemIndex} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
            {index < displayGroups.length - 1 && (
              <SidebarSeparator className="my-3 opacity-60" />
            )}
          </SidebarGroup>
        ))}
        {children}
      </SidebarContent>
    </Sidebar>
  );
}
