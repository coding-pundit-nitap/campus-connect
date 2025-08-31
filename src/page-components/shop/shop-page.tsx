import React from "react";

import Shop from "@/components/shop/shop";
import AuthWrapper from "@/components/wrapper/auth-wrapper";

export default function ShopPage() {
  return (
    <AuthWrapper>
      <Shop />
    </AuthWrapper>
  );
}
