import { Prisma } from "@/generated/client";
import { formatShopData, ShopWithOwnerDetails } from "@/lib/shop-utils";
import shopRepository from "@/repositories/shop.repository";

import { ShopsContainer } from "./shops-container";

export async function Shops() {
  let formattededShops: ShopWithOwnerDetails[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  let initialError: string | undefined;

  try {
    const queryOptions = {
      where: { is_active: true },
      include: { user: { select: { name: true, email: true } } },
      take: 11,
      orderBy: {
        created_at: Prisma.SortOrder.desc,
      },
    };

    const shops = await shopRepository.getShops(queryOptions);
    let initialShops = shops;

    if (shops.length > 10) {
      hasNextPage = true;
      const lastItem = shops.pop();
      nextCursor = lastItem!.id;
      initialShops = shops;
    }

    formattededShops = initialShops.map(formatShopData);
  } catch {
    initialError = "Failed to load shops. Please try again.";
  }

  return (
    <ShopsContainer
      initialShops={formattededShops}
      hasNextPage={hasNextPage}
      nextCursor={nextCursor}
      initialError={initialError}
    />
  );
}
