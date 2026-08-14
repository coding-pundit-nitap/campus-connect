import { describe, expect, it } from "vitest";

import { sanitizeHTML } from "@/lib/sanitize";

describe("sanitizeHTML", () => {
  it("strips script tags entirely", () => {
    const result = sanitizeHTML("<p>hi</p><script>alert(1)</script>");
    expect(result).not.toContain("script");
    expect(result).toBe("<p>hi</p>");
  });

  it("strips disallowed tags (e.g. img) along with their event handlers", () => {
    const result = sanitizeHTML('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("<img");
  });

  it("strips inline event handler attributes but keeps an allowed tag", () => {
    const result = sanitizeHTML('<p onclick="alert(1)">hi</p>');
    expect(result).not.toContain("onclick");
    expect(result).toBe("<p>hi</p>");
  });

  it("strips javascript: URLs from href", () => {
    const result = sanitizeHTML('<a href="javascript:alert(1)">x</a>');
    expect(result).not.toContain("javascript:");
    expect(result).toBe("<a>x</a>");
  });

  it("preserves a safe href alongside allowed attributes", () => {
    const result = sanitizeHTML(
      '<a href="https://example.com" target="_blank">safe link</a>'
    );
    expect(result).toBe(
      '<a href="https://example.com" target="_blank">safe link</a>'
    );
  });

  it("preserves safe markup made of allowed tags", () => {
    const result = sanitizeHTML("<p><strong>bold</strong></p>");
    expect(result).toBe("<p><strong>bold</strong></p>");
  });

  it("strips disallowed tags but keeps their text content", () => {
    const result = sanitizeHTML("<div>hello<span>world</span></div>");
    expect(result).toBe("helloworld");
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeHTML("")).toBe("");
  });
});
