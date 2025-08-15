"use client";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import LoginTabs from "./login-tabs";

interface LoginCardProps {
  className?: string;
  title?: string;
  description?: string;
}

export default function LoginCard({
  className = "mx-4 w-full md:w-1/2",
  title = "Welcome Back",
  description = "Please enter your details",
}: LoginCardProps) {
  const handleGoogleLogin = async () => {
    try {
      console.log("Google login initiated");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error("Google login failed:", err);
      throw new Error("Google login is not yet implemented");
    }
  };

  const handleSignUp = () => {
    console.log("Navigate to sign up");
  };

  const footerContent = (
    <Button
      variant="link"
      className="text-sm text-blue-600 hover:underline"
      onClick={handleSignUp}
      type="button"
    >
      Don&apos;t have an account?
    </Button>
  );

  return (
    <SharedCard
      title={title}
      description={description}
      showHeader={true}
      showFooter={true}
      footerContent={footerContent}
      className={className}
    >
      <LoginTabs />

      <Separator className="my-4" />

      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        type="button"
      >
        Sign in with Google
      </Button>
    </SharedCard>
  );
}
