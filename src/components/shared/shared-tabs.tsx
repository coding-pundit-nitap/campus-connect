import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { TabItem } from "@/types/ui";

/**
 * Props interface for the SharedTabs component.
 *
 * This interface defines all the properties required to configure and render
 * a tabbed interface using the SharedTabs component. It provides type-safe
 * configuration for tab content, styling, and behavior with flexible layout
 * options and customizable styling for different sections of the tab component.
 *
 * @interface SharedTabsProps
 * @property {TabItem[]} tabs - Array of tab configurations containing value, label, content, and disabled state
 * @property {string} defaultValue - The value of the tab that should be active by default
 * @property {string} [className] - Optional additional CSS classes for the main tabs container
 * @property {string} [tabsListClassName] - Optional additional CSS classes for the tabs list/header container
 * @property {string} [tabsContentClassName] - Optional additional CSS classes for the tab content container
 *
 * @example
 * ```tsx
 * const tabsProps: SharedTabsProps = {
 *   tabs: [
 *     { value: "overview", label: "Overview", content: <OverviewComponent /> },
 *     { value: "details", label: "Details", content: <DetailsComponent />, disabled: false }
 *   ],
 *   defaultValue: "overview",
 *   className: "max-w-4xl mx-auto",
 *   tabsListClassName: "bg-gray-100",
 *   tabsContentClassName: "min-h-96"
 * };
 * ```
 *
 * @see {@link TabItem} for the structure of individual tab configurations
 */
interface SharedTabsProps {
  tabs: TabItem[];
  defaultValue: string;
  className?: string;
  tabsListClassName?: string;
  tabsContentClassName?: string;
}

/**
 * Reusable tabs component that provides a standardized tabbed interface with dynamic content.
 *
 * This component serves as a comprehensive tabs wrapper that handles tab navigation,
 * content switching, and responsive layout. It automatically distributes tab triggers
 * evenly across the available width and provides consistent styling and behavior
 * across the application. The component supports disabled tabs, custom content
 * for each tab panel, and extensive styling customization for different sections.
 *
 * @param props - The component props
 * @param props.tabs - Array of tab configurations defining each tab's value, label, content, and state
 * @param props.defaultValue - The value of the tab that should be initially active
 * @param props.className - Optional additional CSS classes for the main tabs container
 * @param props.tabsListClassName - Optional additional CSS classes for the tabs header/list
 * @param props.tabsContentClassName - Optional additional CSS classes for all tab content areas
 *
 * @returns A JSX element containing the complete tabbed interface with all configured tabs
 *
 * @example
 * ```tsx
 * // Basic profile tabs
 * const profileTabs = [
 *   { value: "profile", label: "Profile", content: <ProfileForm /> },
 *   { value: "settings", label: "Settings", content: <SettingsPanel /> },
 *   { value: "security", label: "Security", content: <SecuritySettings /> }
 * ];
 *
 * <SharedTabs
 *   tabs={profileTabs}
 *   defaultValue="profile"
 *   className="max-w-2xl mx-auto"
 * />
 *
 * // Dashboard tabs with custom styling
 * <SharedTabs
 *   tabs={dashboardTabs}
 *   defaultValue="analytics"
 *   className="w-full"
 *   tabsListClassName="bg-card border-b"
 *   tabsContentClassName="p-6 min-h-[400px]"
 * />
 *
 * // Tabs with disabled options
 * const adminTabs = [
 *   { value: "users", label: "Users", content: <UserManagement /> },
 *   { value: "reports", label: "Reports", content: <ReportsPanel /> },
 *   { value: "audit", label: "Audit", content: <AuditLog />, disabled: !hasAuditAccess }
 * ];
 * ```
 *
 * @remarks
 * **Tab Layout:**
 * - Automatically distributes tab triggers evenly using CSS Grid
 * - Full-width responsive design that adapts to container size
 * - Dynamic grid columns based on the number of tabs provided
 *
 * **Content Management:**
 * - Each tab content is rendered in a separate TabsContent component
 * - Content is only mounted when the corresponding tab is active
 * - Consistent padding and spacing applied to all tab content areas
 *
 * **Styling Features:**
 * - Granular styling control for tabs container, list, and content areas
 * - Default full-width layout with customizable additional classes
 * - Consistent 4-unit top padding for all tab content (pt-4)
 * - Integration with design system components and styling
 *
 * **Accessibility Features:**
 * - Proper ARIA attributes and keyboard navigation support
 * - Screen reader friendly tab labels and content association
 * - Focus management when switching between tabs
 * - Support for disabled tab states with appropriate ARIA attributes
 *
 * **Responsive Design:**
 * - Mobile-friendly tab layout that works on all screen sizes
 * - Equal-width tab distribution regardless of label length
 * - Flexible content areas that adapt to different content types
 *
 * **Performance Features:**
 * - Efficient rendering with unique keys for tab mapping
 * - Minimal re-renders when switching between tabs
 * - Optimized DOM structure for smooth animations
 *
 * @see {@link Tabs} from @/components/ui/tabs for the underlying tabs wrapper
 * @see {@link TabsList} from @/components/ui/tabs for the tabs header component
 * @see {@link TabsTrigger} from @/components/ui/tabs for individual tab buttons
 * @see {@link TabsContent} from @/components/ui/tabs for tab content panels
 * @see {@link TabItem} for the structure of individual tab configurations
 *
 * @since 1.0.0
 */
export function SharedTabs({
  tabs,
  defaultValue,
  className = "",
  tabsListClassName = "",
  tabsContentClassName = "",
}: SharedTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className={`w-full ${className}`}>
      <TabsList
        className={`grid w-full ${tabsListClassName}`}
        style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={`pt-4 ${tabsContentClassName}`}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
