import React from "react";

import { LoginCard } from "@/components/login/login-card";

import AuthPage from "./auth";

export default function LoginPage() {
  return (
    <AuthPage>
      <LoginCard
        title="Welcome Back"
        description="Sign in to your account to continue"
        className="w-[60%] md:w-[60%]"
      />
    </AuthPage>
  );
}
