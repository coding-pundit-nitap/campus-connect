"use client";

import { Heart, Loader2 } from "lucide-react";
import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useFavoriteShops, useToggleFavoriteShop } from "@/hooks";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

type FavoriteShopButtonProps = {
  shopId: string;
  className?: string;
};

export function FavoriteShopButton({
  shopId,
  className,
}: FavoriteShopButtonProps) {
  const session = useSession();
  const isAuthenticated = !!session.data?.user?.id;

  const { data: favorites } = useFavoriteShops(isAuthenticated);
  const { mutate: toggleFavorite, isPending } = useToggleFavoriteShop();

  const isFavorite = useMemo(
    () => !!favorites?.some((item) => item.shop.id === shopId),
    [favorites, shopId]
  );

  if (!isAuthenticated) {
    return null;
  }

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(shopId);
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "h-8 w-8 rounded-full bg-background/90 backdrop-blur hover:bg-background",
        isFavorite && "text-rose-600 hover:text-rose-700",
        className
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
      )}
    </Button>
  );
}
