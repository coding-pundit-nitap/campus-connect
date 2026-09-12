import { BatchService } from "../services/batch.service.js";
import { NotificationService } from "../services/notification.service.js";

export const notificationService = new NotificationService();
export const batchService = new BatchService(notificationService);
