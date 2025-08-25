"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * Configuration properties for the QueryProvider component.
 *
 * @interface QueryProviderProps
 */
interface QueryProviderProps {
  /**
   * The child components that should have access to the React Query client.
   * These components and their descendants will be able to use React Query hooks
   * like useQuery, useMutation, and useQueryClient.
   */
  children: React.ReactNode;
}

/**
 * React Query provider component that configures and provides query client functionality.
 *
 * This component sets up a TanStack Query (React Query) client with optimized default
 * configurations for caching, retrying, and error handling. It wraps the application
 * or component tree to provide React Query functionality throughout the component
 * hierarchy. The provider includes intelligent retry logic that handles different
 * HTTP status codes appropriately, prevents unnecessary retries for client errors,
 * and includes development tools for debugging query behavior.
 *
 * @param props - The component props
 * @param props.children - Child components that will have access to React Query
 *
 * @returns A JSX element providing React Query context to child components
 *
 * @see {@link QueryClient} from TanStack Query for client configuration options
 * @see {@link QueryClientProvider} for the provider implementation
 * @see {@link ReactQueryDevtools} for development debugging tools
 *
 * @throws {Error} May throw if QueryClient configuration is invalid
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
            retry: (failureCount, error) => {
              if (error instanceof Error && "status" in error) {
                const status = (error as { status: number }).status;
                if (
                  status >= 400 &&
                  status < 500 &&
                  ![408, 409, 429].includes(status)
                ) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
