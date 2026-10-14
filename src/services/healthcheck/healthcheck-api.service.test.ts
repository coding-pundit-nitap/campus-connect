import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { healthCheckAPIService } from "./healthcheck-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

const axiosError = (
  opts: { code?: string; status?: number; name?: string } = {}
) => {
  const err = new AxiosError(
    "fail",
    opts.code,
    undefined,
    undefined,
    opts.status === undefined
      ? undefined
      : {
          status: opts.status,
          statusText: "",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: null,
        }
  );
  if (opts.name) err.name = opts.name;
  return err;
};

const failTimes = async (n: number) => {
  axios.get.mockRejectedValue(new Error("boom"));
  for (let i = 0; i < n; i++) await healthCheckAPIService.checkDatabase();
};

describe("healthCheckAPIService.checkDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthCheckAPIService.resetCircuitBreaker();
  });
  afterEach(() => vi.useRealTimers());

  it("reports healthy with latency on success", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { status: "healthy", latency: 12 },
        details: "ok",
      },
    });

    await expect(healthCheckAPIService.checkDatabase()).resolves.toEqual({
      status: "healthy",
      latency: 12,
      details: "ok",
    });
    expect(axios.get).toHaveBeenCalledWith("health/database", {
      timeout: 5000,
    });
  });

  it.each([
    [{ success: false, data: null, details: "db down" }, "db down"],
    [
      { success: true, data: null, details: "" },
      "API returned a non-success response.",
    ],
  ])("reports unhealthy for non-success payload %j", async (data, details) => {
    axios.get.mockResolvedValue({ data });

    await expect(healthCheckAPIService.checkDatabase()).resolves.toEqual({
      status: "unhealthy",
      details,
    });
  });

  it.each([
    ["timeout code", axiosError({ code: "ECONNABORTED", status: 500 })],
    ["TimeoutError name", axiosError({ name: "TimeoutError", status: 500 })],
    ["no response", axiosError()],
  ])("reports unreachable on %s", async (_label, err) => {
    axios.get.mockRejectedValue(err);

    const result = await healthCheckAPIService.checkDatabase();

    expect(result.status).toBe("unreachable");
  });

  it("reports database unavailable on 503", async () => {
    axios.get.mockRejectedValue(axiosError({ status: 503 }));

    await expect(healthCheckAPIService.checkDatabase()).resolves.toEqual({
      status: "unhealthy",
      details: "The database is currently unavailable.",
    });
  });

  it.each([
    ["other axios status", axiosError({ status: 500 })],
    ["non-axios error", new Error("boom")],
  ])("reports unknown error for %s", async (_label, err) => {
    axios.get.mockRejectedValue(err);

    await expect(healthCheckAPIService.checkDatabase()).resolves.toEqual({
      status: "unhealthy",
      details: "An unknown error occurred during the health check.",
    });
  });

  it("opens the circuit after 5 consecutive failures", async () => {
    vi.useFakeTimers();
    await failTimes(5);
    axios.get.mockClear();

    const result = await healthCheckAPIService.checkDatabase();

    expect(result.status).toBe("unreachable");
    expect(result.details).toContain("5 consecutive failures");
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("retries after the cooldown elapses", async () => {
    vi.useFakeTimers();
    await failTimes(5);
    vi.advanceTimersByTime(60_001);
    axios.get.mockResolvedValue({
      data: { success: true, data: { latency: 3 }, details: "ok" },
    });

    const result = await healthCheckAPIService.checkDatabase();

    expect(result.status).toBe("healthy");
  });

  it("a success resets the failure count", async () => {
    await failTimes(4);
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: { latency: 1 }, details: "ok" },
    });
    await healthCheckAPIService.checkDatabase();
    await failTimes(4);
    axios.get.mockClear();
    axios.get.mockRejectedValue(new Error("boom"));

    await healthCheckAPIService.checkDatabase();

    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
