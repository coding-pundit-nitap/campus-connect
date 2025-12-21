"use client";
import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";

import { SearchResult } from "@/types";

type SearchHookProps = {
  /** Callback function when a search item is selected */
  onSelectItem?: (value: string) => void;
  /** Callback function when search query changes */
  onSearch: (query: string) => void;
  /** Array of suggestions to check if we should show suggestions dropdown */
  suggestions?: { id: string; title: string; subtitle: string }[];
  /** Initial value for the search term */
  initialValue?: string;
};

type SearchInputProps = {
  /** Current selected category value */
  value: string;
  /** Callback when category is selected or created */
  onChange: (category: string) => void;
  /** Custom suggestions data */
  suggestions?: Array<{ id: string; title: string; subtitle: string }>;
  /** Loading state for suggestions */
  isLoadingSuggestions?: boolean;
  /** Custom search function for external data fetching */
  onSearchQuery?: (query: string) => void;
};

type NavigationSearchProps = {
  /** Function to handle navigation routing */
  onNavigate: (result: SearchResult) => void;
  /** Search results from API */
  searchResults: SearchResult[];
  /** Loading state from API query */
  isLoading: boolean;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
};

export const useSearch = ({
  onSearch,
  onSelectItem = () => {},
  suggestions = [],
  initialValue = "",
}: SearchHookProps) => {
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const hasSuggestions = suggestions.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (hasSuggestions || value.trim().length > 0) {
      setShowSuggestionsDropdown(true);
    } else {
      setShowSuggestionsDropdown(false);
    }

    onSearch(value);
  };

  const handleSelectItem = (value: string) => {
    setInputValue(value);
    setShowSuggestionsDropdown(false);
    onSelectItem(value);
  };

  const handleInputFocus = () => {
    if (hasSuggestions) {
      setShowSuggestionsDropdown(true);
    }
  };

  const handleInputClick = () => {
    if (hasSuggestions) {
      setShowSuggestionsDropdown(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestionsDropdown(false), 200);
  };

  return {
    showSuggestionsDropdown,
    inputValue,

    handleInputBlur,
    handleInputClick,
    handleSelectItem,
    handleInputFocus,
    handleInputChange,

    setShowSuggestionsDropdown,
  };
};

export const useSearchInput = ({
  value,
  onChange,
  suggestions = [],
  isLoadingSuggestions = false,
  onSearchQuery,
}: SearchInputProps) => {
  const debouncedSearchQuery = useMemo(
    () =>
      debounce((query: string) => {
        if (onSearchQuery) {
          onSearchQuery(query);
        }
      }, 300),
    [onSearchQuery]
  );

  const onSearch = useMemo(
    () => (query: string) => {
      onChange(query);

      if (onSearchQuery) {
        if (query.trim().length > 0) {
          debouncedSearchQuery(query);
        } else {
          debouncedSearchQuery("");
        }
      }
    },
    [onChange, onSearchQuery, debouncedSearchQuery]
  );

  const onSelectItem = useMemo(
    () => (selectedValue: string) => {
      onChange(selectedValue);

      if (onSearchQuery) {
        debouncedSearchQuery.cancel();
      }
    },
    [onChange, onSearchQuery, debouncedSearchQuery]
  );

  useEffect(() => {
    return () => {
      debouncedSearchQuery.cancel();
    };
  }, [debouncedSearchQuery]);

  const baseSearch = useSearch({
    onSearch,
    onSelectItem,
    suggestions,
    initialValue: value,
  });

  return {
    ...baseSearch,
    isLoadingSuggestions,
    suggestions,
  };
};

export const useNavigationSearch = ({
  onNavigate,
  debounceDelay = 300,
}: Omit<NavigationSearchProps, "searchResults" | "isLoading">) => {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debouncedSetQuery = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedQuery(query);
      }, debounceDelay),
    [debounceDelay]
  );

  const onSearch = useMemo(
    () => (query: string) => {
      if (query.trim().length >= 2) {
        debouncedSetQuery(query);
      } else {
        debouncedSetQuery.cancel();
        setDebouncedQuery("");
      }
    },
    [debouncedSetQuery]
  );

  const onSelectItem = useMemo(
    () => (value: string, searchResults: SearchResult[]) => {
      const selectedItem = searchResults.find(
        (result) => result.title === value
      );

      if (selectedItem) {
        debouncedSetQuery.cancel();
        onNavigate(selectedItem);
      }
    },
    [onNavigate, debouncedSetQuery]
  );

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  return {
    debouncedQuery,
    onSearch,
    onSelectItem,
    setDebouncedQuery,
  };
};
