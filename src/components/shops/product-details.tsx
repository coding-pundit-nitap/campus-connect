import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type ProductDetailsProps = {
  product: {
    name: string;
    shop: {
      name: string;
    };
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

  return (
    <div className={className}>
      <div className="space-y-4">
        <p className="text-muted-foreground">{product.shop.name}</p>
        <h1 className="text-2xl font-bold">{product.name}</h1>

        <div className="flex items-center gap-3">
          <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-2 py-0.5">
            <Star className="w-3.5 h-3.5 mr-1 fill-white" />
            {product.rating}
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

        <p className="text-gray-600 text-sm leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
}
