import { overrideEnv } from "@tests/helpers/api";
import { afterEach, describe, expect, it } from "vitest";

import { env } from "@/config/env.config";

import robots from "./robots";

describe("robots", () => {
  let restore: () => void = () => {};
  afterEach(() => restore());

  it("allows crawling except private areas and points at the sitemap", () => {
    const result = robots();
    const [all, aiBots] = result.rules as {
      userAgent: string | string[];
      allow?: string;
      disallow: string | string[];
    }[];

    expect(all).toMatchObject({ userAgent: "*", allow: "/" });
    expect(all.disallow).toEqual(
      expect.arrayContaining(["/api/", "/admin/", "/checkout/"])
    );
    expect(aiBots).toMatchObject({ disallow: "/" });
    expect(aiBots.userAgent).toContain("GPTBot");
    expect(result.sitemap).toBe(`${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`);
    expect(result.host).toBe(env.NEXT_PUBLIC_APP_URL);
  });

  it("falls back to the production URL without an app URL", () => {
    restore = overrideEnv(env, { NEXT_PUBLIC_APP_URL: undefined });

    expect(robots().host).toBe("https://connect.nitap.ac.in");
  });
});
