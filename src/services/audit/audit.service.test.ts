import { headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auditQueue } from "@/lib/audit";

import { AuditService } from "./audit.service";

vi.mock("@/lib/audit", () => ({ auditQueue: { add: vi.fn() } }));

const withHeaders = (init: Record<string, string>) =>
  vi.mocked(headers).mockResolvedValue(new Headers(init) as never);

describe("AuditService", () => {
  const service = new AuditService();

  beforeEach(() => vi.clearAllMocks());

  describe("log", () => {
    it("enqueues the entry with the first forwarded IP and user agent", async () => {
      withHeaders({
        "x-forwarded-for": "1.1.1.1, 2.2.2.2",
        "x-real-ip": "9.9.9.9",
        "user-agent": "jest",
      });

      await service.log("admin-1", "SHOP_VERIFY", "User", "u1", {
        why: "spam",
      });

      expect(auditQueue.add).toHaveBeenCalledWith("audit-log", {
        admin_id: "admin-1",
        action: "SHOP_VERIFY",
        target_type: "User",
        target_id: "u1",
        details: { why: "spam" },
        ip_address: "1.1.1.1",
        user_agent: "jest",
      });
    });

    it("falls back to x-real-ip", async () => {
      withHeaders({ "x-real-ip": "9.9.9.9" });

      await service.log("admin-1", "SHOP_VERIFY", "User", "u1");

      expect(vi.mocked(auditQueue.add).mock.calls[0][1]).toMatchObject({
        ip_address: "9.9.9.9",
        user_agent: undefined,
      });
    });

    it("leaves request metadata empty when no headers are present", async () => {
      withHeaders({});

      await service.log("admin-1", "SHOP_VERIFY", "User", "u1");

      expect(vi.mocked(auditQueue.add).mock.calls[0][1]).toMatchObject({
        ip_address: undefined,
        user_agent: undefined,
      });
    });

    it("still enqueues when called outside a request scope", async () => {
      vi.mocked(headers).mockRejectedValue(new Error("no request"));

      await service.log("admin-1", "SHOP_VERIFY", "User", "u1");

      expect(vi.mocked(auditQueue.add).mock.calls[0][1]).toMatchObject({
        admin_id: "admin-1",
        ip_address: undefined,
      });
    });
  });

  it("logWithContext enqueues the given request metadata", async () => {
    await service.logWithContext(
      "admin-1",
      "SHOP_VERIFY",
      "Shop",
      "s1",
      null,
      "3.3.3.3",
      "curl"
    );

    expect(auditQueue.add).toHaveBeenCalledWith("audit-log", {
      admin_id: "admin-1",
      action: "SHOP_VERIFY",
      target_type: "Shop",
      target_id: "s1",
      details: null,
      ip_address: "3.3.3.3",
      user_agent: "curl",
    });
    expect(headers).not.toHaveBeenCalled();
  });
});
