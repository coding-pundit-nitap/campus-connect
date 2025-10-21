import { Prisma } from "@prisma/client";

import { formatShopData } from "@/lib/shop-utils";
import shopRepository from "@/repositories/shop.repository";

import { ShopsContainer } from "./shops-container";

export async function Shops() {
  try {
    const queryOptions = {
      include: { owner: { select: { name: true, email: true } } },
      take: 11,
      orderBy: {
        created_at: Prisma.SortOrder.desc,
      },
    };

    const shops = await shopRepository.getShops(queryOptions);
    let hasNextPage = false;
    let nextCursor: string | null = null;
    let initialShops = shops;

    if (shops.length > 10) {
      hasNextPage = true;
      const lastItem = shops.pop();
      nextCursor = lastItem!.id;
      initialShops = shops;
    }

    const formattededShops = initialShops.map(formatShopData);

    return (
      <ShopsContainer
        initialShops={formattededShops}
        hasNextPage={hasNextPage}
        nextCursor={nextCursor}
      />
    );
  } catch {
    return (
      <ShopsContainer
        initialShops={[]}
        hasNextPage={false}
        nextCursor={null}
        initialError="Failed to load shops. Please try again."
      />
    );
  }
}
