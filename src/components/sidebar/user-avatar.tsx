import Image from "next/image";
import React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

type Props = {
  image?: string | null;
  dimention: number | `${number}` | undefined;
  name?: string | null;
  email?: string | null;
  className?: string;
};

export default function UserAvatar({
  name,
  email,
  dimention,
  image,
  className,
}: Props) {
  const userInitials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : email?.[0]?.toUpperCase() || "U";

  return (
    <Avatar
      className="bg-primary text-primary-foreground"
      style={{ width: `${dimention}px`, height: `${dimention}px` }}
    >
      {image ? (
        <Image
          src={image}
          alt={name || "User"}
          width={dimention}
          height={dimention}
          className={cn("rounded-full object-cover", className)}
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
