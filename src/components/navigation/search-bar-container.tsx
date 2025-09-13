"use client";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { useSearch, useSearchQuery } from "@/hooks";

import { SearchBar } from "./search-bar";

interface SearchBarContainerProps {
  className?: string;
  placeholder?: string;
}

export function SearchBarContainer({
  className,
  placeholder,
}: SearchBarContainerProps) {
  const router = useRouter();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: searchResults = [], isLoading } =
    useSearchQuery(debouncedQuery);

  const suggestions = searchResults.map((result) => ({
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
  }));

  const debouncedSetQuery = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedQuery(query);
      }, 300),
    []
  );

  const onSearch = useMemo(
    () => (query: string) => {
      if (query.trim().length > 0) {
        debouncedSetQuery(query);
      } else {
        debouncedSetQuery("");
      }
    },
    [debouncedSetQuery]
  );

  const onSelectItem = useMemo(
    () => (value: string) => {
      const selectedItem = searchResults.find(
        (result) => result.title === value || result.id === value
      );

      if (selectedItem) {
        if (selectedItem.type === "shop") {
          router.push(`/shops/${selectedItem.id}`);
        } else if (selectedItem.type === "product") {
          if (selectedItem.shop_id) {
            router.push(
              `/shops/${selectedItem.shop_id}/products/${selectedItem.id}`
            );
          } else {
            router.push(
              `/shops?search=${encodeURIComponent(selectedItem.title)}`
            );
          }
        }
      }
    },
    [searchResults, router]
  );

  const {
    isSearching,
    searchTerm,
    handleInputBlur,
    handleInputClick,
    handleSelectItem,
    handleInputFocus,
    handleInputChange,
  } = useSearch({ onSearch, onSelectItem, suggestions });

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  return (
    <SearchBar
      className={className}
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      onClick={handleInputClick}
      onSelectItem={handleSelectItem}
      suggestions={suggestions}
      isSearching={isSearching && (isLoading || suggestions.length > 0)}
      isLoading={isLoading}
    />
  );
}

export default SearchBarContainer;
