import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Link from "next/link";
import Image from "next/image";

import { FaAddressBook } from "react-icons/fa";
import { FaRoad } from "react-icons/fa";
import { CiTimer } from "react-icons/ci";

export default function ShopCard(props: any) {
  return (
    <Link href={`services/shop`}>
      <Card className="m-1 sm:m-2 md:m-4 lg:m-6 xl:m-8 [box-shadow:rgba(50,50,93,0.25)_0px_2px_5px_-1px,rgba(0,0,0,0.3)_0px_1px_3px_-1px]">
        <div>
          <img src={props.image} alt="image" className="max-w-full" />
        </div>
        <CardHeader>
          <CardTitle className="text-xl">{props.shopName}</CardTitle>
          <CardDescription>{props.shopDescription}</CardDescription>
          <CardAction>⭐️ {props.ratings}</CardAction>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">
            <FaAddressBook className="inline" /> {props.address}
          </p>
        </CardContent>
        <CardFooter>
          <p className="font-semibold">
            {" "}
            <CiTimer className="inline" /> {props.openingHours}
          </p>
        </CardFooter>
        <CardFooter>
          <p className="font-semibold">
            <FaRoad className="inline" /> {props.distance}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
