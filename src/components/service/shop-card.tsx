import { Shop } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { FaAddressBook, FaClock } from "react-icons/fa";

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
          <Image src={props.closing} alt="image" className="max-w-full" />
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
              <button
                type="button"
                className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              >
                Default
              </button>
            ) : (
              <button
                type="button"
                className="focus:outline-none text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-1.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
              >
                In Active
              </button>
            )}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
