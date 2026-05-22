import React from "react";

import AuthWrapper from "@/components/wrapper/auth-wrapper";
import FavoritesPage from "@/page-components/favorites/favorites-page";

export default function Page() {
  return (
    <AuthWrapper>
      <FavoritesPage />
    </AuthWrapper>
  );
}
