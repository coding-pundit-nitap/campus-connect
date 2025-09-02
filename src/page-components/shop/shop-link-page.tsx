import React from "react";

import ShopFormContainer from "@/components/link-shop/shop-form-container";
import AuthWrapper from "@/components/wrapper/auth-wrapper";

export default function ShopLinkPage() {
  return (
    <AuthWrapper>
      <ShopFormContainer />
    </AuthWrapper>
  );
}
