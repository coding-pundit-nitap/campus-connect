"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleTheme } from "@/hooks";

/**
 * Props interface for the ThemeToggle component.
 *
 * @interface ThemeToggleProps
 */
export interface ThemeToggleProps {
  /** Additional CSS classes to apply to the button */
  className?: string;
  /** Button size variant */
  size?: "default" | "sm" | "lg" | "icon";
  /** Button visual variant */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  /** Whether to show text label alongside the icon */
  showLabel?: boolean;
  /** Custom icon component for light mode */
  lightIcon?: React.ComponentType<{ className?: string }>;
  /** Custom icon component for dark mode */
  darkIcon?: React.ComponentType<{ className?: string }>;
  /** Default icon component shown during hydration */
  defaultIcon?: React.ComponentType<{ className?: string }>;
}

/**
 * A theme toggle component that switches between light and dark modes.
 *
 * This component provides a user-friendly way to toggle between light and dark themes
 * in the application. It handles the hydration mismatch by showing a default state
 * during server-side rendering and the actual theme state after client-side hydration.
 *
 * @param className - Additional CSS classes to apply to the button
 * @param size - Button size variant
 * @param variant - Button visual variant
 * @param showLabel - Whether to show text label alongside the icon
 * @param lightIcon - Custom icon component for light mode
 * @param darkIcon - Custom icon component for dark mode
 * @param defaultIcon - Default icon component shown during hydration
 * @returns A themed toggle button component
 */
export function ThemeToggle({
  className = "h-9 w-9",
  size = "icon",
  variant = "ghost",
  showLabel = false,
  lightIcon: LightIcon = Moon,
  darkIcon: DarkIcon = Sun,
  defaultIcon: DefaultIcon = Sun,
}: ThemeToggleProps) {
  const { handleToggle, isDarkMode, label, mounted } = useToggleTheme();

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className}>
        <DefaultIcon className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
        {showLabel && <span className="ml-2">Theme</span>}
      </Button>
    );
  }
  const IconComponent = isDarkMode ? DarkIcon : LightIcon;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={className}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
    >
      <IconComponent className="h-4 w-4" />
      <span className="sr-only">Toggle theme</span>
      {showLabel && <span className="ml-2">{label}</span>}
    </Button>
  );
}
