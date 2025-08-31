import Image from "next/image";
import { User } from "next-auth";
import React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Props = {
  user: User;
};

export default function UserAvatar({ user }: Props) {
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <Avatar className="h-10 w-10">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name || "User"}
          width={40}
          height={40}
          className="rounded-full object-cover"
          priority={false}
          unoptimized={false}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {userInitials}
      </AvatarFallback>
    </Avatar>
  );
}
