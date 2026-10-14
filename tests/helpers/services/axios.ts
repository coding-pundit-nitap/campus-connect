import type { AxiosInstance } from "axios";

import { mockOf } from "../mock-of";

/**
 * Module factory for "@/lib/axios":
 *
 *   vi.mock("@/lib/axios", async () =>
 *     (await import("@tests/helpers/services")).axiosModule());
 *   import axiosInstance from "@/lib/axios";
 *   vi.mocked(axiosInstance.get).mockResolvedValue(envelope(data));
 */
export function axiosModule() {
  return { default: mockOf<AxiosInstance>() };
}

/** An axios response whose body is the `ActionResponse<T>` envelope. */
export const envelope = <T>(data: T, details = "ok") => ({
  data: { success: true, error: false, data, details },
});
