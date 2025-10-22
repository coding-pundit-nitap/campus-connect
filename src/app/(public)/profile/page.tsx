import React from "react";

import AuthWrapper from "@/components/wrapper/auth-wrapper";
import Profile from "@/page-components/profile/profile";

export default function page() {
  return (
    <AuthWrapper>
      <Profile />
    </AuthWrapper>
  );
}
