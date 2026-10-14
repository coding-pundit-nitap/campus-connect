import type { AxiosRequestConfig } from "axios";

import axiosInstance from "@/lib/axios";
import type { ActionResponse } from "@/types/response.types";

/**
 * Shared request/unwrap helpers for the `*-api.service.ts` client wrappers.
 * Every API route answers with an `ActionResponse<T>` envelope; these return
 * the `data` payload so callers don't repeat `response.data.data`.
 */
export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.get<ActionResponse<T>>(url, config);
  return response.data.data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.post<ActionResponse<T>>(
    url,
    body,
    config
  );
  return response.data.data;
}
