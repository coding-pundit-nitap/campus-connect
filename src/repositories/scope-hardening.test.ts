// Source-level guard for the scope-override bug class fixed in
// "fix(security): stop caller `where` from replacing repository scope".
//
// Why a source test instead of behavioural tests? Because the type system
// provably cannot enforce this invariant (see the block comment at the top of
// base.repository.ts: `Omit<XArgs, "where">` is a weak type, and TypeScript
// applies only the weak-type common-property check when a fresh object literal
// is inferred to a naked generic type parameter). Per-site behavioural tests
// would need one integration test per scoped method - 30+ of them, each
// needing its own seed data - and would still only cover the methods someone
// remembered to write a test for. Reverting all ten repository files to the
// vulnerable form failed only 5 tests; the other 27 sites could be re-broken
// with a green suite.
//
// This test reads the repository sources and fails on the *shape* of the bug,
// so it covers every scoped method, including ones added later.
//
// Two failure modes, both observed in this codebase:
//
//   (i)  spread of the caller's options bag AFTER the `where` key, at the
//        query-argument level - the original leak:
//            findMany({ where: { user_id }, ...options })
//
//   (ii) the caller's `where` spread LAST inside the `where` literal, so a
//        caller filter still overrides the scope keys:
//            findMany({ where: { shop_id, deleted_at: null, ...where } })
//        This was live in ProductRepository.findManyByShopId and was missed by
//        the first pass precisely because the destructure looked correct.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPOSITORY_DIR = join(process.cwd(), "src", "repositories");

/** Spread of a caller-supplied options bag, e.g. `...options`, `...(data ?? {})`. */
const BAG_SPREAD = /^\.\.\.\(?\s*(options|opts|args|data|rest)\b/;

/**
 * Strips line and block comments so the prose in base.repository.ts - which
 * deliberately quotes the forbidden shape as an example - is not scanned as
 * code. Naive about comment markers inside string literals; the repository
 * sources contain none, and a false positive here would fail loudly rather
 * than silently pass.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/([^:])\/\/.*$/gm, "$1");
}

/**
 * Splits the body of one object literal into its top-level entries, ignoring
 * commas nested inside braces, brackets, parens or strings.
 */
function topLevelEntries(body: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = "";
  let quote: string | null = null;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];

    if (quote) {
      current += ch;
      if (ch === quote && body[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "{" || ch === "[" || ch === "(") depth++;
    if (ch === "}" || ch === "]" || ch === ")") depth--;

    if (ch === "," && depth === 0) {
      entries.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) entries.push(current.trim());
  return entries.filter(Boolean);
}

/** Every object literal in `source`, as {start, body} with brace-matched bodies. */
function objectLiterals(source: string): { index: number; body: string }[] {
  const out: { index: number; body: string }[] = [];

  for (let i = 0; i < source.length; i++) {
    if (source[i] !== "{") continue;
    let depth = 0;
    let quote: string | null = null;
    let end = -1;

    for (let j = i; j < source.length; j++) {
      const ch = source[j];
      if (quote) {
        if (ch === quote && source[j - 1] !== "\\") quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) continue;
    out.push({ index: i, body: source.slice(i + 1, end) });
  }
  return out;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

type Violation = { file: string; line: number; rule: string; snippet: string };

function auditFile(file: string, raw: string): Violation[] {
  const source = stripComments(raw);
  const violations: Violation[] = [];

  for (const literal of objectLiterals(source)) {
    const entries = topLevelEntries(literal.body);

    // Rule (i): an options-bag spread must never follow a `where` key.
    const whereIdx = entries.findIndex((e) => /^where\s*:/.test(e));
    if (whereIdx !== -1) {
      const bagIdx = entries.findIndex((e) => BAG_SPREAD.test(e));
      if (bagIdx !== -1 && bagIdx > whereIdx) {
        violations.push({
          file,
          line: lineOf(source, literal.index),
          rule: "options-bag spread after `where` - the bag's `where` replaces the scope",
          snippet: entries[bagIdx],
        });
      }
    }

    // Rule (ii): inside a `where` literal, `...where` must come first so the
    // scope keys that follow it win.
    for (const entry of entries) {
      if (!/^where\s*:\s*\{/.test(entry)) continue;
      const inner = entry.slice(entry.indexOf("{") + 1, entry.lastIndexOf("}"));
      const innerEntries = topLevelEntries(inner);
      const spreadIdx = innerEntries.findIndex((e) =>
        /^\.\.\.\(?\s*(where|filter)\b/.test(e)
      );
      if (spreadIdx > 0) {
        violations.push({
          file,
          line: lineOf(source, literal.index),
          rule: "`...where` is not the first entry in the `where` literal - a caller filter overrides the scope keys before it",
          snippet: entry.replace(/\s+/g, " ").slice(0, 120),
        });
      }
    }
  }

  return violations;
}

function repositoryFiles(): string[] {
  return readdirSync(REPOSITORY_DIR)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .sort();
}

describe("repository scope hardening (source-level guard)", () => {
  it("no repository spreads a caller options bag after a `where` key", () => {
    const violations = repositoryFiles().flatMap((f) =>
      auditFile(f, readFileSync(join(REPOSITORY_DIR, f), "utf8")).filter((v) =>
        v.rule.startsWith("options-bag")
      )
    );

    expect(
      violations,
      `Scope-override bug reintroduced. Write:\n` +
        `    const { where, ...rest } = options ?? {};\n` +
        `    prisma.x.findMany({ ...rest, where: { ...where, scope } });\n` +
        `See the block comment at the top of base.repository.ts.\n\n` +
        violations.map((v) => `  ${v.file}:${v.line} - ${v.snippet}`).join("\n")
    ).toEqual([]);
  });

  it("every `where` literal that merges a caller filter puts `...where` first", () => {
    const violations = repositoryFiles().flatMap((f) =>
      auditFile(f, readFileSync(join(REPOSITORY_DIR, f), "utf8")).filter((v) =>
        v.rule.startsWith("`...where`")
      )
    );

    expect(
      violations,
      `A caller-supplied \`where\` is spread after the scope keys, so it can ` +
        `override them. Put \`...where\` first.\n\n` +
        violations.map((v) => `  ${v.file}:${v.line} - ${v.snippet}`).join("\n")
    ).toEqual([]);
  });

  // Proves the guard is wired to real files rather than silently scanning an
  // empty set - a green result above is only meaningful if this holds.
  it("scans the whole repository layer", () => {
    const files = repositoryFiles();
    expect(files.length).toBeGreaterThanOrEqual(15);
    expect(files).toContain("order.repository.ts");
    expect(files).toContain("product.repository.ts");
    expect(files).toContain("shop.repository.ts");
  });

  // The guard's own unit tests: both historical bugs must be detected, and the
  // shapes that are legitimately in the codebase must not be.
  describe("detects the shapes it is meant to detect", () => {
    it("catches the original leak (`where` then `...options`)", () => {
      const found = auditFile(
        "sample.ts",
        `return this.prismaClient.order.findMany({
           where: { user_id },
           ...options,
         });`
      );
      expect(found).toHaveLength(1);
      expect(found[0].rule).toMatch(/options-bag spread after `where`/);
    });

    it("catches finding A (`...where` last inside the `where` literal)", () => {
      const found = auditFile(
        "sample.ts",
        `return this.prismaClient.product.findMany({
           where: {
             shop_id,
             deleted_at: null,
             ...where,
           },
           ...rest,
         });`
      );
      const ruleB = found.filter((v) => v.rule.startsWith("`...where`"));
      expect(ruleB).toHaveLength(1);
    });

    it("catches `...(options ?? {})` after `where`", () => {
      const found = auditFile(
        "sample.ts",
        `const query = { where: { shop_id }, ...(options ?? {}) };`
      );
      expect(found).toHaveLength(1);
    });

    it("accepts the corrected shape", () => {
      expect(
        auditFile(
          "sample.ts",
          `const { where, ...rest } = options ?? {};
           return this.prismaClient.order.findMany({
             ...rest,
             where: { ...where, user_id },
           });`
        )
      ).toEqual([]);
    });

    it("accepts an overridable default before the bag spread", () => {
      expect(
        auditFile(
          "sample.ts",
          `const { where, ...rest } = options ?? {};
           return this.prismaClient.userAddress.findMany({
             orderBy: { is_default: "desc" },
             ...rest,
             where: { ...where, user_id: id },
           });`
        )
      ).toEqual([]);
    });

    it("accepts a fully internal `where` with no caller bag", () => {
      expect(
        auditFile(
          "sample.ts",
          `return this.prismaClient.order.updateMany({
             where: { id: { in: order_ids } },
             data: { order_status },
           });`
        )
      ).toEqual([]);
    });

    it("ignores the forbidden shape when it appears inside a comment", () => {
      expect(
        auditFile(
          "sample.ts",
          `// prisma.order.findMany({ where: { user_id }, ...options });
           /* findMany({ where: { user_id }, ...options }) */
           const { where, ...rest } = options ?? {};
           return this.prismaClient.order.findMany({
             ...rest,
             where: { ...where, user_id },
           });`
        )
      ).toEqual([]);
    });
  });
});
