import axios from "axios";

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

class ConnectivityAPIService {
  private readonly axiosInstance = axios.create({
    timeout: 5000,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });

  check = async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      await this.axiosInstance.head("/api/health");
      return true;
    } catch {
      return false;
    }
  };

  getInfo = (): NetworkInformation | null => {
    const nav = navigator as NavigatorWithConnection;
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!connection) {
      return null;
    }

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  };

  isSlow = (): boolean => {
    const info = this.getInfo();
    if (!info) return false;

    return (
      info.effectiveType === "slow-2g" ||
      info.effectiveType === "2g" ||
      (info.downlink !== undefined && info.downlink < 1)
    );
  };
}

export const connectivityAPIService = new ConnectivityAPIService();

export default connectivityAPIService;
