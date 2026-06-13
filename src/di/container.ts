import { prisma } from "@/lib/prisma";
import { AdminAuditRepository } from "@/repositories/admin-audit.repository";
import { BatchRepository } from "@/repositories/batch.repository";
import { BrandRepository } from "@/repositories/brand.repository";
import { BroadcastNotificationRepository } from "@/repositories/broadcast.repository";
import { CartRepository } from "@/repositories/cart.repository";
import { CategoryRepository } from "@/repositories/category.repository";
import { NotificationRepository } from "@/repositories/notification.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { PayoutRepository } from "@/repositories/payout.repository";
import { PlatformSettingsRepository } from "@/repositories/platform-settings.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { ReviewRepository } from "@/repositories/reviews.repository";
import { ShopRepository } from "@/repositories/shop.repository";
// Repositories
import { UserRepository } from "@/repositories/user.repository";
import { UserAddressRepository } from "@/repositories/user-address.repository";
import { AuditService } from "@/services/audit/audit.service";
import { BatchService } from "@/services/batch/batch.service";
import { BrandServices } from "@/services/brand/brand.service";
import { CartService } from "@/services/cart/cart.service";
import { CategoryServices } from "@/services/category/category.service";
import { FileUploadService } from "@/services/file-upload/file-upload.service";
import { NotificationService } from "@/services/notification/notification.service";
import { OrderService } from "@/services/order/order.service";
import { ProductService } from "@/services/product/product.service";
import { ReviewService } from "@/services/review/review.service";
import { DBSearchService } from "@/services/search/db-search.service";
// Services
import { UserService } from "@/services/user/user.service";

// Instantiate repositories
export const userRepository = new UserRepository(prisma);
export const productRepository = new ProductRepository(prisma);
export const categoryRepository = new CategoryRepository(prisma);
export const brandRepository = new BrandRepository(prisma);
export const shopRepository = new ShopRepository(prisma);
export const orderRepository = new OrderRepository(prisma);
export const cartRepository = new CartRepository(prisma);
export const batchRepository = new BatchRepository(prisma);
export const notificationRepository = new NotificationRepository(prisma);
export const broadcastRepository = new BroadcastNotificationRepository(prisma);
export const reviewRepository = new ReviewRepository(prisma);
export const platformSettingsRepository = new PlatformSettingsRepository(
  prisma
);
export const userAddressRepository = new UserAddressRepository(prisma);
export const payoutRepository = new PayoutRepository(prisma);
export const adminAuditRepository = new AdminAuditRepository(prisma);

// Instantiate services
export const userService = new UserService(userRepository);
export const productService = new ProductService(productRepository);
export const categoryServices = new CategoryServices(categoryRepository);
export const brandServices = new BrandServices(brandRepository);
export const fileUploadService = new FileUploadService();
export const notificationService = new NotificationService(
  broadcastRepository,
  notificationRepository
);
export const orderService = new OrderService(
  orderRepository,
  platformSettingsRepository,
  notificationService
);
export const cartService = new CartService(
  cartRepository,
  platformSettingsRepository,
  productRepository
);
export const batchService = new BatchService(
  batchRepository,
  orderRepository,
  productRepository,
  shopRepository,
  notificationService
);
export const reviewService = new ReviewService(
  productRepository,
  reviewRepository,
  notificationService
);
export const auditService = new AuditService();
export const dbSearchService = new DBSearchService(
  productRepository,
  shopRepository,
  categoryRepository,
  brandRepository
);

export const container = {
  db: prisma,
  // Repositories
  userRepository,
  productRepository,
  categoryRepository,
  brandRepository,
  fileUploadService,
  shopRepository,
  orderRepository,
  cartRepository,
  batchRepository,
  notificationRepository,
  broadcastRepository,
  reviewRepository,
  platformSettingsRepository,
  userAddressRepository,
  payoutRepository,
  adminAuditRepository,

  // Services
  userService,
  productService,
  categoryServices,
  brandServices,
  notificationService,
  orderService,
  cartService,
  batchService,
  reviewService,
  auditService,
  dbSearchService,
};

export default container;
