"use client";
import { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
export interface FilterConfig<T extends object> {
  basePath: string;
  initialValues: T;
  paramMapping?: Partial<Record<keyof T, string>>;
}

export function useUrlFilters<T extends object>({
  basePath,
  initialValues,
  paramMapping = {},
}: FilterConfig<T>) {
  const router = useRouter();
  const [filters, setFilters] = useState<T>(initialValues);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildQueryString = useCallback(
    (overrides: Partial<T> = {}) => {
      const params = new URLSearchParams();
      const currentFilters = { ...filters, ...overrides };

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== "all" && String(value).trim()) {
          const paramName = (paramMapping[key as keyof T] as string) || key;
          params.set(paramName, String(value).trim());
        }
      });

      return params.toString();
    },
    [filters, paramMapping]
  );

  const applyFilters = useCallback(
    (overrides: Partial<T> = {}) => {
      const queryString = buildQueryString(overrides);
      const path = `${basePath}${queryString ? `?${queryString}` : ""}`;
      router.push(path as Route);
    },
    [basePath, buildQueryString, router]
  );

  const clearFilter = useCallback(
    <K extends keyof T>(key: K) => {
      const defaultValue = initialValues[key];
      setFilters((prev) => ({ ...prev, [key]: defaultValue }));
      applyFilters({ [key]: defaultValue } as unknown as Partial<T>);
    },
    [applyFilters, initialValues]
  );

  const clearAllFilters = useCallback(() => {
    setFilters(initialValues);
    router.push(basePath as Route);
  }, [basePath, initialValues, router]);

  const hasActiveFilters = useCallback(() => {
    return Object.entries(filters).some(([key, value]) => {
      const initial = initialValues[key as keyof T];
      return value !== initial && value !== "all" && value !== "";
    });
  }, [filters, initialValues]);

  return {
    filters,
    setFilters,
    updateFilter,
    applyFilters,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    buildQueryString,
  };
}
