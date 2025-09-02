import { Shop } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { FaAddressBook, FaClock } from "react-icons/fa";

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

export default function ShopCard(props: Shop) {
  return (
    <Link
      href={{
        pathname: "services/shop",
        query: {
          name: props.name,
        },
      }}
    >
      <Card className="m-1 sm:m-2 md:m-4 lg:m-6 xl:m-8 [box-shadow:rgba(50,50,93,0.25)_0px_2px_5px_-1px,rgba(0,0,0,0.3)_0px_1px_3px_-1px]">
        <div>
          <Image
            src={"https://google.com"}
            alt="image"
            className="max-w-full"
          />
        </div>
        <CardHeader>
          <CardTitle className="font-bold text-2xl text-[#0a0a0a]">
            {props.name}
          </CardTitle>
          <CardDescription className="text-[#171717]">
            {props.description}
          </CardDescription>
          <CardAction className="text-[#0a0a0a]">⭐️ </CardAction>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-[#262626]">
            <FaAddressBook className="inline text-[#737373]" /> &nbsp;{" "}
            {props.location}
          </p>
        </CardContent>
        <CardFooter>
          <p className="font-semibold text-[#262626]">
            {" "}
            <FaClock className="inline text-[#737373]" /> &nbsp; {props.opening}
          </p>
        </CardFooter>
        <CardFooter>
          <p className="font-semibold">
            {props.is_active ? (
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
