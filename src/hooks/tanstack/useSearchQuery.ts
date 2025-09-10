import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { searchAPIService } from "@/services/api";

export const useSearchQuery = (query: string) => {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: () => searchAPIService.search(query),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
