import { Review } from "@/generated/client";

export interface ReviewWithUser extends Review {
  user: {
    name: string | null;
    image: string | null;
  };
}
