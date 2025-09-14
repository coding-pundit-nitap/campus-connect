import { CheckCircle, Clock, MapPin, User, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { environment } from "@/config/env.config";
import { useShops } from "@/hooks/useShops";
import { ShopWithOwner } from "@/types";

export default function ShopCard({
  shop,
  priority,
}: {
  shop: ShopWithOwner;
  priority: number;
}) {
  const { isOpen, formatTime } = useShops();

  const open = isOpen(shop);

  return (
    <Link href={`/shops/${shop.id}`}>
      <Card className="w-full max-w-sm hover:shadow-xl [box-shadow:rgba(50,50,93,0.25)_0px_2px_5px_-1px,rgba(0,0,0,0.3)_0px_1px_3px_-1px] overflow-hidden">
        <div className="relative">
          <Image
            width={300}
            height={200}
            src={
              `${environment.minioBaseUrl}/${shop.imageKey}` ||
              "/placeholders/placeholder.png"
            }
            alt={`${shop.name}`}
            priority={priority < 5}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {shop.is_active ? (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
            {shop.is_active && (
              <Badge
                variant={open ? "default" : "destructive"}
                className={open ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {open ? "Open" : "Closed"}
              </Badge>
            )}
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="font-bold text-xl mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {shop.name}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                {shop.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            <span className="line-clamp-1">{shop.location}</span>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            <span>
              {formatTime(shop.opening)} - {formatTime(shop.closing)}
            </span>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <User className="w-4 h-4 mr-2 text-primary" />
            <span className="line-clamp-1">By {shop.owner.name}</span>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className="w-full hover:scale-105 transition-all duration-200 hover:shadow-md"
            variant={shop.is_active ? "default" : "outline"}
            disabled={!shop.is_active}
          >
            {shop.is_active ? "Visit Shop" : "Shop Inactive"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
