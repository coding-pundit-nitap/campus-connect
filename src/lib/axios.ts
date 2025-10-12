import axios from "axios";

/**
 * Pre-configured axios instance for campus connect API communication.
 *
 * A centralized HTTP client instance configured with default settings for
 * communicating with the campus connect backend API. This instance provides
 * consistent configuration across the application and serves as the foundation
 * for all API service classes.
 *
 */
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "/api";
  }

  return `${process.env.NEXT_PUBLIC_APP_URL}${process.env.NEXT_PUBLIC_API_URL || "/api"}`;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API response error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      },
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
