import { Book, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShopWithOwner } from "@/types";

export default function ShopCard({ shop }: { shop: ShopWithOwner }) {
  return (
    <Link href={`/owner-shops/name=${shop.id}`}>
      <Card className="m-1 sm:m-2 md:m-4 lg:m-6 xl:m-8 [box-shadow:rgba(50,50,93,0.25)_0px_2px_5px_-1px,rgba(0,0,0,0.3)_0px_1px_3px_-1px]">
        <div>
          <Image
            width={300}
            height={200}
            src={"/placeholders/placeholder.jpg"}
            alt="image"
            className="max-w-full"
          />
        </div>
        <CardHeader>
          <CardTitle className="font-bold text-2xl">{shop.name}</CardTitle>
          <CardDescription>{shop.description}</CardDescription>
          <CardAction>⭐️</CardAction>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">
            <Book className="inline" /> &nbsp; {shop.location}
          </p>
        </CardContent>
        <CardFooter>
          <p className="font-semibold">
            {" "}
            <Clock className="inline" /> &nbsp; {shop.opening}
          </p>
        </CardFooter>
        <CardFooter>
          <p className="font-semibold">
            {shop.is_active ? (
              <div className="flex flex-wrap items-center gap-2 md:flex-row">
                <Button>ACTIVE</Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 md:flex-row">
                <Button>INACTIVE</Button>
              </div>
            )}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
