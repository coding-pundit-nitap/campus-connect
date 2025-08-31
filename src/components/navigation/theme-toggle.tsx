"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

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
  /** Make it controlled */
  isDarkMode?: boolean;
  /** Toggle function */
  onToggle: () => void;
  /** Mounted state */
  mounted: boolean;
  /** Optional label for the toggle button */
  label?: string;
}

export function ThemeToggle({
  className = "h-9 w-9",
  size = "icon",
  variant = "ghost",
  showLabel = false,
  lightIcon: LightIcon = Moon,
  darkIcon: DarkIcon = Sun,
  defaultIcon: DefaultIcon = Sun,
  isDarkMode = false,
  onToggle,
  mounted,
  label = "Theme",
}: ThemeToggleProps) {
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
      onClick={onToggle}
      className={className}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
    >
      <IconComponent className="h-4 w-4" />
      <span className="sr-only">Toggle theme</span>
      {showLabel && <span className="ml-2">{label}</span>}
    </Button>
  );
}
