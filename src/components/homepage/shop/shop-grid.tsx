import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function ShopGrid({ children }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}
