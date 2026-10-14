import { NextRequest } from "next/server";

/** Build a NextRequest for route-handler tests. */
export function makeRequest(
  path: string,
  init: { method?: string; body?: unknown; headers?: HeadersInit } = {}
): NextRequest {
  const { body, ...rest } = init;
  return new NextRequest(new URL(path, "http://localhost"), {
    ...rest,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Wrap dynamic route params the way Next 15+ passes them (a Promise). */
export const routeParams = <T extends Record<string, string | string[]>>(
  params: T
) => ({ params: Promise.resolve(params) });

/** Read status + parsed JSON body from a route handler Response. */
export async function readJson<T = unknown>(res: Response) {
  return { status: res.status, body: (await res.json()) as T };
}
