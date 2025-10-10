import { Package, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProductDetailsProps = {
  product: {
    name: string;
    shop: {
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

export default function ProductDetails({
  product,
  className = "lg:col-span-7",
}: ProductDetailsProps) {
  const discountedPrice =
    (product.price * (100 - (product.discount ?? 0))) / 100;

  const getStockStatus = () => {
    if (product.stock_quantity === 0) return "Out of Stock";
    if (product.stock_quantity <= 5) return "Low Stock";
    if (product.stock_quantity <= 10) return "Limited Stock";
    return "In Stock";
  };

  const getStockColor = () => {
    if (product.stock_quantity === 0) return "text-red-600";
    if (product.stock_quantity <= 5) return "text-orange-600";
    if (product.stock_quantity <= 10) return "text-yellow-600";
    return "text-green-600";
  };

  const getRatingColors = () => {
    const rating = product.rating || 0;
    if (rating >= 4.5) return "bg-green-50 border-green-200 text-green-700";
    if (rating >= 4.0) return "bg-blue-50 border-blue-200 text-blue-700";
    if (rating >= 3.5) return "bg-yellow-50 border-yellow-200 text-yellow-700";
    if (rating >= 3.0) return "bg-orange-50 border-orange-200 text-orange-700";
    return "bg-red-50 border-red-200 text-red-700";
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <p className="text-muted-foreground">{product.shop.name}</p>
        <h1 className="text-2xl font-bold">{product.name}</h1>

        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              "text-white font-bold text-sm px-2 py-0.5",
              getRatingColors()
            )}
          >
            <Star className="w-3.5 h-3.5 mr-1 fill-white" />
            {product.rating.toFixed(1)}
          </Badge>
          <p className="text-sm font-medium text-muted-foreground">
            {product.review_count} Reviews
          </p>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">₹{discountedPrice}</span>
          {product.discount && product.discount > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                ₹{product.price}
              </span>
              <span className="text-lg font-bold text-green-600">
                {product.discount}% off
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className={`font-medium ${getStockColor()}`}>
            {getStockStatus()}
          </span>
          <span className="text-muted-foreground">
            ({product.stock_quantity})
          </span>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
}
