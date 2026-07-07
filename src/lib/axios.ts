import axios from "axios";

import { env } from "@/config/env.config";

const axiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export default axiosInstance;
