import React from "react";
import { RegisterCard } from "@/components/register/register-card";
import AuthPage from "./auth";

export default function RegisterPage() {
  return (
    <AuthPage>
      <RegisterCard
        title="Create an Account"
        description="Sign up to get started"
        className="w-[60%] md:w-[60%]"
      />
    </AuthPage>
  );
}
