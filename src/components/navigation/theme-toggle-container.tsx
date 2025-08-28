"use client";
import { useToggleTheme } from "@/hooks";

import { ThemeToggle, ThemeToggleProps } from "./theme-toggle";

type ThemeToggleContainerProps = Omit<
  ThemeToggleProps,
  "isDarkMode" | "onToggle" | "mounted" | "label"
>;

export function ThemeToggleContainer(props: ThemeToggleContainerProps) {
  const { handleToggle, isDarkMode, label, mounted } = useToggleTheme();

  return (
    <ThemeToggle
      {...props}
      isDarkMode={isDarkMode}
      onToggle={handleToggle}
      mounted={mounted}
      label={label}
    />
  );
}

export default ThemeToggleContainer;
