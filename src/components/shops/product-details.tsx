import { ExternalLink, Package, Star, Store } from "lucide-react";
import { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";

type ProductDetailsProps = {
  product: {
    name: string;
    shop: {
      id?: string;
      name: string;
    };
    stock_quantity: number;
    rating: number;
    review_count: number;
    price: number;
    discount: number | null;
    description: string;
  };
  className?: string;
};

const RATING_COLORS = {
  excellent: "bg-green-500/10 text-green-600 border-green-500/20",
  good: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  average: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  poor: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  bad: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function ProductDetails({
  product,
  className,
}: ProductDetailsProps) {
  const discountedPrice =
    (product.price * (100 - (product.discount ?? 0))) / 100;
  const savings = product.price - discountedPrice;

  const getStockStatus = () => {
    if (product.stock_quantity === 0)
      return { label: "Out of Stock", color: "text-red-600", bg: "bg-red-50" };
    if (product.stock_quantity <= 5)
      return {
        label: "Low Stock",
        color: "text-orange-600",
        bg: "bg-orange-50",
      };
    if (product.stock_quantity <= 10)
      return {
        label: "Limited Stock",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    return { label: "In Stock", color: "text-green-600", bg: "bg-green-50" };
  };

  const getRatingStyle = () => {
    const rating = product.rating || 0;
    if (rating >= 4.5) return RATING_COLORS.excellent;
    if (rating >= 4.0) return RATING_COLORS.good;
    if (rating >= 3.5) return RATING_COLORS.average;
    if (rating >= 3.0) return RATING_COLORS.poor;
    return RATING_COLORS.bad;
  };

  const stockStatus = getStockStatus();

  return (
    <div className={cn("space-y-6", className)}>
      <Link
        href={(product.shop.id ? `/shops/${product.shop.id}` : "#") as Route}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
      >
        <Store className="h-4 w-4" />
        <span className="group-hover:underline">{product.shop.name}</span>
        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        {product.name}
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant="outline"
          className={cn("gap-1.5 py-1", getRatingStyle())}
        >
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-semibold">{product.rating.toFixed(1)}</span>
        </Badge>
        <span className="text-sm text-muted-foreground">
          {product.review_count}{" "}
          {product.review_count === 1 ? "review" : "reviews"}
        </span>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl md:text-4xl font-bold">
            ₹{discountedPrice.toFixed(0)}
          </span>
          {product.discount && product.discount > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                ₹{product.price}
              </span>
              <Badge className="bg-green-600 hover:bg-green-600 text-white">
                {product.discount}% OFF
              </Badge>
            </>
          )}
        </div>
        {savings > 0 && (
          <p className="text-sm text-green-600 font-medium">
            You save ₹{savings.toFixed(0)}
          </p>
        )}
      </div>

      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium",
          stockStatus.bg,
          stockStatus.color
        )}
      >
        <Package className="h-4 w-4" />
        <span>{stockStatus.label}</span>
        {product.stock_quantity > 0 && (
          <span className="text-muted-foreground">
            ({product.stock_quantity} left)
          </span>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">About this product</h3>
        <div
          className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: sanitizeHTML(product.description),
          }}
        />
      </div>
    </div>
  );
}
