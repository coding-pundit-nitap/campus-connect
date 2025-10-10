import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const profileCard = () => {
  return (
    <Card className="transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
      <CardHeader className="flex justify-center">
        <Avatar className="size-30 md:max-size-45 lg:max-size-55">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 items-center">
        <p className="text-lg md:text-xl lg:text-2xl font-semibold">
          Kaushal Kumar
        </p>
        <p>kaushal.cse.23@nitap.ac.in</p>
        <p>+91-9953601435</p>
      </CardContent>
    </Card>
  );
};

export default profileCard;
