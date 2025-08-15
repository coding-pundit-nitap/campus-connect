"use client";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import RegisterForm from "./register-form";
import { useRouter } from "next/navigation";

interface RegisterCardProps {
  className?: string;
  title?: string;
  description?: string;
}

export default function RegisterCard({
  className = "mx-4 w-full md:w-1/2",
  title = "Welcome",
  description = "Please enter your details",
}: RegisterCardProps) {
  const router = useRouter();
  const handleGoogleLogin = async () => {
    try {
      console.log("Google login initiated");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error("Google login failed:", err);
      throw new Error("Google login is not yet implemented");
    }
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const footerContent = (
    <Button
      variant="link"
      className="text-sm text-blue-600 hover:underline"
      onClick={handleSignIn}
      type="button"
    >
      Already have an account?
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
      <RegisterForm isStaff={false} />,

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
