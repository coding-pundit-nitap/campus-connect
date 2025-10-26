export async function checkDatabaseConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("/api/health/database", {
      method: "GET",
      cache: "no-cache",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }

    return false;
  } catch (error) {
    console.warn("Database connectivity check failed:", error);
    return false;
  }
}

export async function getDatabaseStatus(): Promise<{
  isConnected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = performance.now();

  try {
    const isConnected = await checkDatabaseConnectivity();
    const latency = performance.now() - startTime;

    return {
      isConnected,
      latency: isConnected ? latency : undefined,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
