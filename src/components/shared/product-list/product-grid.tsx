import React from "react";

interface ProductGridProps {
  children: React.ReactNode;
  count?: number;
}

export function ProductGrid({ children, count }: ProductGridProps) {
  const itemCount =
    count !== undefined ? count : React.Children.count(children);

  if (itemCount === 1) {
    return (
      <div className="flex justify-center w-full py-4">
        <div className="w-full max-w-[310px]">{children}</div>
      </div>
    );
  }

  if (itemCount === 2) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center max-w-[640px] mx-auto py-2 w-full">
        {children}
      </div>
    );
  }

  if (itemCount === 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center max-w-[960px] mx-auto py-2 w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-2 w-full">
      {children}
    </div>
  );
}
