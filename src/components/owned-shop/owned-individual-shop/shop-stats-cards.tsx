import { Clock, Package, ShoppingCart, Tag } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface ShopStatsCardsProps {
  productCount: number;
  orderCount: number;
  categoryCount: number;
  pendingOrderCount: number;
}

export function ShopStatsCards({
  productCount,
  orderCount,
  categoryCount,
  pendingOrderCount,
}: ShopStatsCardsProps) {
  const stats = [
    {
      label: "Products",
      value: productCount,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Orders",
      value: orderCount,
      icon: ShoppingCart,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Categories",
      value: categoryCount,
      icon: Tag,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Pending Orders",
      value: pendingOrderCount,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
