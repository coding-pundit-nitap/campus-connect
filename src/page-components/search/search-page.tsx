"use client";

import {
  SearchDepartments,
  SearchFrame,
  SearchHero,
  SearchInputForm,
  SearchResults,
  SearchStatusBar,
} from "./search-components";
import { SearchProvider } from "./search-context";
import { SearchDynamicFilters } from "./search-filters";

export default function SearchPage() {
  return (
    <SearchProvider>
      <SearchFrame>
        <SearchHero />
        <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 shadow-xl rounded-3xl p-6 md:p-8 mb-8">
          <SearchInputForm />
          <SearchDepartments />
          <SearchDynamicFilters />
        </div>
        <SearchStatusBar />
        <SearchResults />
      </SearchFrame>
    </SearchProvider>
  );
}
