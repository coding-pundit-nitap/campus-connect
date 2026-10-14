/**
 * Like `callArg` from "@tests/helpers", but accepts any mock (including the
 * `MockInstance` members of `Mocked<T>` produced by `mockOf`).
 */
export const argOf = <T = unknown>(
  fn: { mock: { calls: unknown[][] } },
  call = 0,
  arg = 0
): T => fn.mock.calls[call]?.[arg] as T;
