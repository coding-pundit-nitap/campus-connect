export const MAX_SSE_CONNECTIONS_PER_USER =
  parseInt(process.env.MAX_SSE_CONNECTIONS_PER_USER || "", 10) || 3;

export const SSE_CONNECTION_TTL =
  parseInt(process.env.SSE_CONNECTION_TTL || "", 10) || 300;

export const SSE_HEARTBEAT_INTERVAL =
  parseInt(process.env.SSE_HEARTBEAT_INTERVAL || "", 10) || 15000;

export const DEFAULT_PAGE_SIZE =
  parseInt(process.env.DEFAULT_PAGE_SIZE || "", 10) || 10;

export const MAX_PAGE_SIZE =
  parseInt(process.env.MAX_PAGE_SIZE || "", 10) || 100;

export const MAX_FILE_SIZE_MB =
  parseInt(process.env.MAX_FILE_SIZE_MB || "", 10) || 5;

export const PRESIGNED_URL_EXPIRY =
  parseInt(process.env.PRESIGNED_URL_EXPIRY || "", 10) || 300;

export const MAX_UNREAD_NOTIFICATIONS =
  parseInt(process.env.MAX_UNREAD_NOTIFICATIONS || "", 10) || 100;

export const DEFAULT_NOTIFICATION_LIMIT =
  parseInt(process.env.DEFAULT_NOTIFICATION_LIMIT || "", 10) || 20;

export const VALID_ORDER_TRANSITIONS = {
  NEW: ["BATCHED", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  BATCHED: ["NEW", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: [
    "NEW",
    "PREPARING",
    "READY_FOR_PICKUP",
    "COMPLETED",
    "CANCELLED",
  ],
  COMPLETED: [],
  CANCELLED: [],
} as const;
