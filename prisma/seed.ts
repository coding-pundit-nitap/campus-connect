import bcrypt from 'bcryptjs';
import { Role, PrismaClient, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { faker } from '@faker-js/faker';

const hashPassword = (password: string) => {
  return bcrypt.hash(password, 10);
};


const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting the seeding process...');

  // ----------------------------------------
  // 1. CLEANUP PHASE: Delete all existing data
  // Delete in reverse order of dependency to avoid constraint violations
  // ----------------------------------------
  console.log('🗑️  Deleting existing data...');
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.userAddress.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.account.deleteMany(),
    prisma.shop.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('🗑️  Data deleted successfully.');

  // ----------------------------------------
  // 2. SEED USERS
  // ----------------------------------------
  console.log('👤 Creating users...');
  const defaultPassword = await hashPassword('password123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nitap.ac.in',
      name: 'Admin',
      role: Role.ADMIN,
      hash_password: defaultPassword,
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: 'seller@nitap.ac.in',
      name: 'Campus Canteen',
      role: Role.USER, 
      hash_password: defaultPassword,
      phone: faker.phone.number(),
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@nitap.ac.in',
      name: faker.person.fullName(),
      role: Role.USER,
      hash_password: defaultPassword,
      phone: faker.phone.number(),
    },
  });
  console.log(`👤 Created ${await prisma.user.count()} users.`);

  // ----------------------------------------
  // 3. SEED A SHOP
  // ----------------------------------------
  console.log('🏪 Creating a shop...');
  const shop = await prisma.shop.create({
    data: {
      name: 'NIT-AP Daily Needs',
      description: 'Your one-stop shop for all essentials, snacks, and drinks on campus.',
      location: 'Beside Main Canteen, Block-I',
      opening: '09:00',
      closing: '21:00',
      is_active: true,
      verification_status: 'VERIFIED',
      owner_id: seller.id,
    },
  });
  console.log(`🏪 Created shop: "${shop.name}"`);

  // ----------------------------------------
  // 4. SEED CATEGORIES FOR THE SHOP
  // ----------------------------------------
  console.log('🏷️  Creating categories...');
  const snacksCategory = await prisma.category.create({ data: { name: 'Snacks & Chips', shop_id: shop.id } });
  const drinksCategory = await prisma.category.create({ data: { name: 'Beverages', shop_id: shop.id } });
  const stationeryCategory = await prisma.category.create({ data: { name: 'Stationery', shop_id: shop.id } });
  console.log('🏷️  Created 3 categories.');

  // ----------------------------------------
  // 5. SEED PRODUCTS
  // ----------------------------------------
  console.log('🛍️  Creating products...');
  const categories = [snacksCategory.id, drinksCategory.id, stationeryCategory.id];
  for (let i = 0; i < 20; i++) {
    await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.commerce.price({ min: 10, max: 250 }),
        stock_quantity: faker.number.int({ min: 5, max: 100 }),
        image_url: faker.image.urlLoremFlickr({ category: 'food' }),
        shop_id: shop.id,
        category_id: faker.helpers.arrayElement(categories),
      },
    });
  }
  console.log(`🛍️  Created 20 products.`);

  // ----------------------------------------
  // 6. SEED A USER ADDRESS
  // ----------------------------------------
  console.log('🏠 Creating a user address...');
  await prisma.userAddress.create({
    data: {
      user_id: user1.id,
      label: 'Hostel Room',
      building: 'Siang Hostel',
      room_number: 'B-201',
      is_default: true,
    },
  });
  console.log('🏠 Created a default address for a user.');
  
  // ----------------------------------------
  // 7. SEED A HISTORICAL ORDER to make the app look used
  // ----------------------------------------
  console.log('🧾 Creating a historical order...');
  const productsForOrder = await prisma.product.findMany({ where: { shop_id: shop.id }, take: 3 });
  const totalPrice = productsForOrder.reduce((acc, p) => acc + Number(p.price), 0);
  
  await prisma.order.create({
    data: {
      display_id: `NITAP-${faker.number.int({ min: 1000, max: 9999 })}`,
      user_id: user1.id,
      shop_id: shop.id,
      total_price: totalPrice,
      payment_method: PaymentMethod.ONLINE,
      payment_status: PaymentStatus.COMPLETED,
      order_status: OrderStatus.COMPLETED, 
      delivery_address_snapshot: 'Siang Hostel, Room B-201',
      items: {
        create: productsForOrder.map(p => ({
          product_id: p.id,
          quantity: 1,
          price: p.price
        }))
      }
    }
  });
  console.log('🧾 Created a historical order.');

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
