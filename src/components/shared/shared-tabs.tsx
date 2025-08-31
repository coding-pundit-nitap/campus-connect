"use client";
import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TabItem } from "@/types";

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
