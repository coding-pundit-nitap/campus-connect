import axiosInstance from "../axios";

interface NetworkInformation {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

export async function checkConnectivity(): Promise<boolean> {
  if (!navigator.onLine) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await axiosInstance.head("/favicon.ico", {
      headers: {
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return true;
  } catch {
    try {
      const response = await axiosInstance.get(
        "https://dns.google/resolve?name=google.com&type=A",
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

/**
 * Get connection type and quality information
 */
export function getConnectionInfo() {
  const nav = navigator as NavigatorWithConnection;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) {
    return null;
  }

  return {
    effectiveType: connection.effectiveType || "unknown",
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false,
  };
}

/**
 * Check if the connection is slow
 */
export function isSlowConnection(): boolean {
  const info = getConnectionInfo();
  if (!info) return false;

  return (
    info.effectiveType === "slow-2g" ||
    info.effectiveType === "2g" ||
    info.downlink < 1
  );
}
