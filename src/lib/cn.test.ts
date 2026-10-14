import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it.each([
    [["a", "b"], "a b"],
    [["a", false && "b", undefined, null], "a"],
    [["px-2", "px-4"], "px-4"],
    [[{ hidden: true, block: false }], "hidden"],
  ])("merges %j into %s", (inputs, expected) => {
    expect(cn(...inputs)).toBe(expected);
  });
});
