import { BatchService } from "../services/batch.service";
import { NotificationService } from "../services/notification.service";

export const notificationService = new NotificationService();
export const batchService = new BatchService(notificationService);
