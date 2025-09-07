import Image from "next/image";
import React from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Dialog from "@/page-components/profile/dialog";

const Profile = () => {
  return (
    <Card>
      <CardHeader className="relative">
        <div className="flex justify-center">
          <Image
            className="rounded-full"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqh7Rg8QvzgzcaQOPnbiSiRuO6D-WHYeXuLw&s"
            width={250}
            height={250}
            alt="Picture of the author"
            style={{ objectFit: "fill" }}
          />
          <CardAction className="absolute top-0 right-0">Owner</CardAction>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center flex-col items-center">
        <p>Kaushal Kumar</p>
        <p>kaushal.cse.23@nitap.ac.in</p>
        <p>papum hostel, national institute of technology, AP</p>
        <p></p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Dialog />
      </CardFooter>
    </Card>
  );
};

export default Profile;
