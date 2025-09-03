import React from "react";

import Shop from "@/components/owned-shop/owned-individual-shop/shop";
import AuthWrapper from "@/components/wrapper/auth-wrapper";

export default function OwnedShopsPage() {
  return (
    <AuthWrapper>
      <Shop />
    </AuthWrapper>
  );
}
