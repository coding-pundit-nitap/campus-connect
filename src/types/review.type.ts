import { Review } from "@prisma/client";

export interface ReviewWithUser extends Review {
  user: {
    name: string | null;
    image: string | null;
  };
}
