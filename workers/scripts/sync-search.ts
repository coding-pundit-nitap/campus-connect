import { elasticClient, INDICES } from "../lib/elasticsearch";
import { prisma } from "../lib/prisma";
import {
  ORDER_MAPPING,
  PRODUCT_MAPPING,
  SHOP_MAPPING,
  USER_MAPPING,
} from "../search/mappings";

async function ensureIndices() {
  console.log("Ensuring Indices...");

  const indices = [
    { name: INDICES.SHOPS, mapping: SHOP_MAPPING },
    { name: INDICES.PRODUCTS, mapping: PRODUCT_MAPPING },
    { name: INDICES.ORDERS, mapping: ORDER_MAPPING },
    { name: INDICES.USERS, mapping: USER_MAPPING },
  ];

  for (const { name, mapping } of indices) {
    const exists = await elasticClient.indices.exists({ index: name });
    if (exists) {
      console.log(`Index ${name} exists. Deleting to apply new mapping...`);
      await elasticClient.indices.delete({ index: name });
    }
    await elasticClient.indices.create({
      index: name,
      mappings: mapping,
    });
    console.log(`Created index ${name}.`);
  }
}

async function syncShops() {
  console.log("Syncing Shops...");
  const shops = await prisma.shop.findMany({
    where: { is_active: true },
  });

  if (shops.length === 0) return;

  const operations = shops.flatMap((shop) => [
    { index: { _index: INDICES.SHOPS, _id: shop.id } },
    {
      id: shop.id,
      name: shop.name,
      description: shop.description,
      location: shop.location,
      opening: shop.opening,
      closing: shop.closing,
      image_key: shop.image_key,
      is_active: shop.is_active,
      verification_status: shop.verification_status,
      created_at: shop.created_at,
    },
  ]);

  const bulkResponse = await elasticClient.bulk({ refresh: true, operations });

  if (bulkResponse.errors) {
    console.error("Errors during shop sync:", bulkResponse.items);
  } else {
    console.log(`Synced ${shops.length} shops.`);
  }
}

async function syncProducts() {
  console.log("Syncing Products...");
  const products = await prisma.product.findMany({
    include: { category: true },
  });

  if (products.length === 0) return;

  const operations = products.flatMap((product) => [
    { index: { _index: INDICES.PRODUCTS, _id: product.id } },
    {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      discount: Number(product.discount),
      stock_quantity: product.stock_quantity,
      shop_id: product.shop_id,
      category: product.category ? product.category.name : null,
      rating:
        product.review_count > 0
          ? product.rating_sum / product.review_count
          : 0,
      image_key: product.image_key,
      created_at: product.created_at,
    },
  ]);

  const bulkResponse = await elasticClient.bulk({ refresh: true, operations });

  if (bulkResponse.errors) {
    console.error("Errors during product sync:", bulkResponse.items);
  } else {
    console.log(`Synced ${products.length} products.`);
  }
}

async function syncOrders() {
  console.log("Syncing Orders...");
  const orders = await prisma.order.findMany({
    include: { user: { select: { email: true } } },
  });

  if (orders.length === 0) return;

  const operations = orders.flatMap((order) => {
    if (!order.user_id) return [];
    return [
      { index: { _index: INDICES.ORDERS, _id: order.id } },
      {
        id: order.id,
        shop_id: order.shop_id,
        display_id: order.display_id,
        user_email: order.user?.email,
        delivery_address: order.delivery_address_snapshot,
        status: order.order_status,
        total_price: Number(order.total_price),
        created_at: order.created_at,
      },
    ];
  });

  if (operations.length > 0) {
    const bulkResponse = await elasticClient.bulk({
      refresh: true,
      operations,
    });

    if (bulkResponse.errors) {
      console.error("Errors during order sync:", bulkResponse.items);
    } else {
      console.log(`Synced ${orders.length} orders.`);
    }
  }
}

async function syncUsers() {
  console.log("Syncing Users...");
  const users = await prisma.user.findMany();

  if (users.length === 0) return;

  const operations = users.flatMap((user) => [
    { index: { _index: INDICES.USERS, _id: user.id } },
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shop_id: user.shop_id,
      created_at: user.createdAt,
    },
  ]);

  const bulkResponse = await elasticClient.bulk({ refresh: true, operations });

  if (bulkResponse.errors) {
    console.error("Errors during user sync:", bulkResponse.items);
  } else {
    console.log(`Synced ${users.length} users.`);
  }
}

async function main() {
  try {
    await ensureIndices();
    await syncShops();
    await syncProducts();
    await syncOrders();
    await syncUsers();
    console.log("Search sync completed successfully.");
  } catch (error) {
    console.error("Search sync failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
