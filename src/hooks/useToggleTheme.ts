"use client";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

export const useToggleTheme = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);
  const isDarkMode = resolvedTheme === "dark";
  const label = isDarkMode ? "Light" : "Dark";

  return {
    handleToggle,
    isDarkMode,
    label,
    mounted,
  };
};
