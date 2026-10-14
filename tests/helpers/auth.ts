import type authUtilsInstance from "@/lib/utils/auth.utils.server";

import { mockOf } from "./mock-of";

/**
 * Module factory for "@/lib/utils/auth.utils.server".
 *
 *   vi.mock("@/lib/utils/auth.utils.server", async () =>
 *     (await import("@tests/helpers")).authUtilsModule());
 *   import authUtils from "@/lib/utils/auth.utils.server";
 *   const auth = vi.mocked(authUtils);
 *   auth.getUserId.mockResolvedValue("user-1");
 */
export function authUtilsModule() {
  const authUtils = mockOf<typeof authUtilsInstance>();
  return { default: authUtils, authUtils };
}
