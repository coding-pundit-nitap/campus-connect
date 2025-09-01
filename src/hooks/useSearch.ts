"use client";
import { useState } from "react";
type searchProps = {
  /** Callback function when a search item is selected */
  onSelectItem: (value: string) => void;
  /** Callback function when search query changes */
  onSearch: (query: string) => void;
  /** Array of suggestions to check if we should show popover */
  suggestions: { id: string; title: string; subtitle: string }[];
};
export const useSearch = ({
  onSearch,
  onSelectItem,
  suggestions = [],
}: searchProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (suggestions.length > 0) {
      setIsSearching(true);
    } else if (value.trim().length > 0) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
    onSearch(value);
  };

  const handleSelectItem = (value: string) => {
    setSearchTerm(value);
    setIsSearching(false);
    onSelectItem(value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsSearching(true);
    }
  };

  const handleInputClick = () => {
    if (suggestions.length > 0) {
      setIsSearching(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setIsSearching(false), 100);
  };

  return {
    isSearching,
    setIsSearching,
    searchTerm,
    handleInputBlur,
    handleInputClick,
    handleSelectItem,
    handleInputFocus,
    handleInputChange,
  };
};
