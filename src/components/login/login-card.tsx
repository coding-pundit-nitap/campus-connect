"use client";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import LoginForm from "./login-form";
import { useRouter } from "next/navigation";
import { signIn } from "@/auth";

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
  const router = useRouter();
  const handleGoogleLogin = async () => {
    try {
      await signIn("google");
    } catch (err) {
      console.error("Google login failed:", err);
      throw new Error("Google login is not yet implemented");
    }
  };

  const handleSignUp = () => {
    router.push("/register");
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
      <LoginForm isStaff={false} />,
      <Separator className="my-4" />
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        type="button"
      >
        <Image
          src="/svg/google-icon.svg"
          alt="Google Icon"
          width={16}
          height={16}
        />
        Sign in with Google
      </Button>
    </SharedCard>
  );
}
