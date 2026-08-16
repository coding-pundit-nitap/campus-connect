import type { PrismaClient } from "@/generated/client";
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

export interface ContainerDeps {
  prisma: PrismaClient;
}

export function createContainer(deps: ContainerDeps) {
  const { prisma } = deps;

  // Instantiate repositories
  const userRepository = new UserRepository(prisma);
  const productRepository = new ProductRepository(prisma);
  const categoryRepository = new CategoryRepository(prisma);
  const brandRepository = new BrandRepository(prisma);
  const shopRepository = new ShopRepository(prisma);
  const orderRepository = new OrderRepository(prisma);
  const cartRepository = new CartRepository(prisma);
  const batchRepository = new BatchRepository(prisma);
  const notificationRepository = new NotificationRepository(prisma);
  const broadcastRepository = new BroadcastNotificationRepository(prisma);
  const reviewRepository = new ReviewRepository(prisma);
  const platformSettingsRepository = new PlatformSettingsRepository(prisma);
  const userAddressRepository = new UserAddressRepository(prisma);
  const payoutRepository = new PayoutRepository(prisma);
  const adminAuditRepository = new AdminAuditRepository(prisma);

  // Instantiate services
  const userService = new UserService(userRepository);
  const productService = new ProductService(productRepository);
  const categoryServices = new CategoryServices(categoryRepository);
  const brandServices = new BrandServices(brandRepository);
  const fileUploadService = new FileUploadService();
  const notificationService = new NotificationService(
    broadcastRepository,
    notificationRepository
  );
  const orderService = new OrderService(
    orderRepository,
    platformSettingsRepository,
    notificationService,
    prisma
  );
  const cartService = new CartService(
    cartRepository,
    platformSettingsRepository,
    productRepository
  );
  const batchService = new BatchService(
    batchRepository,
    orderRepository,
    productRepository,
    shopRepository,
    notificationService,
    prisma
  );
  const reviewService = new ReviewService(
    productRepository,
    reviewRepository,
    notificationService,
    prisma
  );
  const auditService = new AuditService();
  const dbSearchService = new DBSearchService(
    productRepository,
    shopRepository,
    categoryRepository,
    brandRepository
  );

  return {
    db: prisma,
    // Repositories
    userRepository,
    productRepository,
    categoryRepository,
    brandRepository,
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
    fileUploadService,
    notificationService,
    orderService,
    cartService,
    batchService,
    reviewService,
    auditService,
    dbSearchService,
  } as const;
}

export type Container = ReturnType<typeof createContainer>;

// Production graph. Preserves every pre-existing named export.
export const container = createContainer({ prisma });

export const {
  userRepository,
  productRepository,
  categoryRepository,
  brandRepository,
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
  userService,
  productService,
  categoryServices,
  brandServices,
  fileUploadService,
  notificationService,
  orderService,
  cartService,
  batchService,
  reviewService,
  auditService,
  dbSearchService,
} = container;

export default container;
