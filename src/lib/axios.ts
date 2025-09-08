import axios from "axios";

/**
 * Pre-configured axios instance for college connect API communication.
 *
 * A centralized HTTP client instance configured with default settings for
 * communicating with the college connect backend API. This instance provides
 * consistent configuration across the application and serves as the foundation
 * for all API service classes.
 *
 */
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export default axiosInstance;
