export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum OrderStatus {
  NEW = "NEW",
  BATCHED = "BATCHED",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum BatchStatus {
  OPEN = "OPEN",
  LOCKED = "LOCKED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum SellerVerificationStatus {
  NOT_STARTED = "NOT_STARTED",
  PENDING = "PENDING",
  REQUIRES_ACTION = "REQUIRES_ACTION",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum PaymentMethod {
  CASH = "CASH",
  ONLINE = "ONLINE",
}

export enum PayoutStatus {
  PENDING = "PENDING",
  IN_TRANSIT = "IN_TRANSIT",
  PAID = "PAID",
  FAILED = "FAILED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  CANCELLED = "CANCELLED",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
}

export enum AdminAction {
  SHOP_VERIFY = "SHOP_VERIFY",
  SHOP_REJECT = "SHOP_REJECT",
  SHOP_ACTIVATE = "SHOP_ACTIVATE",
  SHOP_DEACTIVATE = "SHOP_DEACTIVATE",
  SHOP_DELETE = "SHOP_DELETE",
  USER_MAKE_ADMIN = "USER_MAKE_ADMIN",
  USER_REMOVE_ADMIN = "USER_REMOVE_ADMIN",
  USER_SUSPEND = "USER_SUSPEND",
  USER_UNSUSPEND = "USER_UNSUSPEND",
  USER_DELETE = "USER_DELETE",
  USER_FORCE_SIGNOUT = "USER_FORCE_SIGNOUT",
  BROADCAST_CREATE = "BROADCAST_CREATE",
  ORDER_STATUS_OVERRIDE = "ORDER_STATUS_OVERRIDE",
}

export enum NotificationType {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export enum NotificationCategory {
  GENERAL = "GENERAL",
  ORDER = "ORDER",
  SYSTEM = "SYSTEM",
  ANNOUNCEMENT = "ANNOUNCEMENT",
}

export interface UserAddress {
  id: string;
  label: string;
  hostel_block: string | null;
  building: string;
  room_number: string;
  notes: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  action_url: string | null;
  category: NotificationCategory;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  action_url: string | null;
  category: NotificationCategory;
  created_at: Date;
  updated_at: Date;
}
