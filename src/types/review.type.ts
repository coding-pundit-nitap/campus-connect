import { Review } from "@/../prisma/generated/client";

export interface ReviewWithUser extends Review {
  user: {
    name: string | null;
    image: string | null;
  };
}
