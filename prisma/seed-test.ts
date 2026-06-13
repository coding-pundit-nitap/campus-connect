import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "../src/generated/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.batch.deleteMany(),
    prisma.batchSlot.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.userAddress.deleteMany(),
    prisma.user.deleteMany(),
    prisma.shop.deleteMany(),
  ]);

  const shop = await prisma.shop.create({
    data: {
      id: "test-shop-1",
      name: "Tiffin Express",
      description: "High-speed campus cooking and meal prep.",
      location: "Campus Dining Hall A",
      opening: "08:00",
      closing: "22:00",
      image_key: "shop_tiffin_express",
      upi_id: "tiffin@upi",
      qr_image_key: "qr_tiffin_express",
      is_active: true,
      accepting_orders: true,
      verification_status: "VERIFIED",
    },
  });

  const vendor = await prisma.user.create({
    data: {
      id: "vendor-user-1",
      email: "vendor@campus.com",
      name: "Vendor Owner",
      role: "USER",
      status: "ACTIVE",
      shop_id: "test-shop-1",
    },
  });

  const customer = await prisma.user.create({
    data: {
      id: "customer-user-1",
      email: "student@campus.com",
      name: "Rohan Sharma",
      phone: "+919876543210",
    },
  });

  const address = await prisma.userAddress.create({
    data: {
      id: "address-1",
      label: "Hostel Block C",
      hostel_block: "C",
      building: "Satpura Hostel",
      room_number: "302",
      is_default: true,
      user_id: "customer-user-1",
    },
  });

  const category = await prisma.category.create({
    data: {
      id: "cat-1",
      name: "Thali Meals",
    },
  });

  const product = await prisma.product.create({
    data: {
      id: "prod-1",
      name: "Special Veg Thali",
      description: "Paneer, Dal, Sabzi, Rice, and 3 Roti",
      price: 120.0,
      stock_quantity: 50,
      image_key: "prod_special_veg_thali",
      shop_id: "test-shop-1",
      category_id: "cat-1",
    },
  });

  const slot = await prisma.batchSlot.create({
    data: {
      id: "slot-1",
      shop_id: "test-shop-1",
      cutoff_time_minutes: 1020,
      label: "Evening Dinner Batch",
      is_active: true,
      sort_order: 1,
    },
  });

  const batchOpen = await prisma.batch.create({
    data: {
      id: "batch-open-1",
      shop_id: "test-shop-1",
      slot_id: "slot-1",
      cutoff_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "OPEN",
    },
  });

  const batchLocked = await prisma.batch.create({
    data: {
      id: "batch-locked-1",
      shop_id: "test-shop-1",
      slot_id: "slot-1",
      cutoff_time: new Date(Date.now() - 60 * 60 * 1000),
      status: "LOCKED",
    },
  });

  const batchTransit = await prisma.batch.create({
    data: {
      id: "batch-transit-1",
      shop_id: "test-shop-1",
      slot_id: "slot-1",
      cutoff_time: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: "IN_TRANSIT",
    },
  });

  const orderBatched1 = await prisma.order.create({
    data: {
      id: "order-batched-1",
      display_id: "ORD-8812",
      item_total: 120.0,
      delivery_fee: 10.0,
      platform_fee: 2.0,
      total_price: 132.0,
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
      order_status: "BATCHED",
      delivery_address_snapshot: "Satpura Hostel, Room 302",
      user_id: "customer-user-1",
      shop_id: "test-shop-1",
      batch_id: "batch-open-1",
    },
  });

  await prisma.orderItem.create({
    data: {
      id: "item-batched-1",
      quantity: 1,
      price: 120.0,
      order_id: "order-batched-1",
      product_id: "prod-1",
    },
  });

  const orderBatched2 = await prisma.order.create({
    data: {
      id: "order-batched-2",
      display_id: "ORD-9903",
      item_total: 240.0,
      delivery_fee: 10.0,
      platform_fee: 2.0,
      total_price: 252.0,
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
      order_status: "BATCHED",
      delivery_address_snapshot: "Satpura Hostel, Room 302",
      user_id: "customer-user-1",
      shop_id: "test-shop-1",
      batch_id: "batch-locked-1",
    },
  });

  await prisma.orderItem.create({
    data: {
      id: "item-batched-2",
      quantity: 2,
      price: 120.0,
      order_id: "order-batched-2",
      product_id: "prod-1",
    },
  });

  const orderBatched3 = await prisma.order.create({
    data: {
      id: "order-batched-3",
      display_id: "ORD-4402",
      item_total: 120.0,
      delivery_fee: 10.0,
      platform_fee: 2.0,
      total_price: 132.0,
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
      order_status: "OUT_FOR_DELIVERY",
      delivery_address_snapshot: "Satpura Hostel, Room 302",
      user_id: "customer-user-1",
      shop_id: "test-shop-1",
      batch_id: "batch-transit-1",
      delivery_otp: "1234",
    },
  });

  await prisma.orderItem.create({
    data: {
      id: "item-batched-3",
      quantity: 1,
      price: 120.0,
      order_id: "order-batched-3",
      product_id: "prod-1",
    },
  });

  const orderDirectNew = await prisma.order.create({
    data: {
      id: "order-direct-new-1",
      display_id: "ORD-1011",
      item_total: 120.0,
      delivery_fee: 25.0,
      platform_fee: 2.0,
      total_price: 147.0,
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
      order_status: "NEW",
      delivery_address_snapshot: "Satpura Hostel, Room 302",
      user_id: "customer-user-1",
      shop_id: "test-shop-1",
      is_direct_delivery: true,
    },
  });

  await prisma.orderItem.create({
    data: {
      id: "item-direct-1",
      quantity: 1,
      price: 120.0,
      order_id: "order-direct-new-1",
      product_id: "prod-1",
    },
  });

  const orderDirectOut = await prisma.order.create({
    data: {
      id: "order-direct-out-1",
      display_id: "ORD-2022",
      item_total: 120.0,
      delivery_fee: 25.0,
      platform_fee: 2.0,
      total_price: 147.0,
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
      order_status: "OUT_FOR_DELIVERY",
      delivery_address_snapshot: "Satpura Hostel, Room 302",
      user_id: "customer-user-1",
      shop_id: "test-shop-1",
      is_direct_delivery: true,
      delivery_otp: "5678",
    },
  });

  await prisma.orderItem.create({
    data: {
      id: "item-direct-2",
      quantity: 1,
      price: 120.0,
      order_id: "order-direct-out-1",
      product_id: "prod-1",
    },
  });

  console.log("✅ Seed completed: test database successfully populated.", {
    shop,
    vendor,
    customer,
    address,
    category,
    product,
    slot,
    batchOpen,
    batchLocked,
    batchTransit,
    orderBatched1,
    orderBatched2,
    orderBatched3,
    orderDirectNew,
    orderDirectOut,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
