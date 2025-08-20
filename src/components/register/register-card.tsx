"use client";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import RegisterForm from "./register-form";
import { useRouter } from "next/navigation";
import { signIn } from "@/auth";

/**
 * Configuration properties for the RegisterCard component.
 *
 * @interface RegisterCardProps
 */
interface RegisterCardProps {
  /**
   * Optional CSS class names to apply to the register card container.
   * Used for custom styling and responsive layout adjustments.
   *
   * @default "mx-4 w-full md:w-1/2"
   */
  className?: string;

  /**
   * The title text displayed in the card header.
   * Provides the main heading for the registration interface.
   *
   * @default "Welcome"
   */
  title?: string;

  /**
   * The description text displayed below the title in the card header.
   * Provides additional context or instructions for the registration process.
   *
   * @default "Please enter your details"
   */
  description?: string;
}

/**
 * Registration card component that provides a complete user registration interface.
 *
 * This component renders a comprehensive registration form wrapped in a SharedCard
 * layout with multiple authentication options. It includes a standard registration
 * form for non-staff users, Google OAuth integration, and navigation to the login
 * page for existing users. The component is responsive and includes proper error
 * handling for authentication failures. It serves as the main registration entry
 * point for new users in the college connect application.
 *
 * @param props - The component props
 * @param props.className - Optional CSS classes for styling customization
 * @param props.title - Header title text for the registration card
 * @param props.description - Header description text providing user guidance
 *
 * @returns A JSX element containing the complete registration interface
 *
 * @see {@link SharedCard} for the underlying card layout component
 * @see {@link RegisterForm} for the main registration form implementation
 * @see {@link Button} for the UI button components used throughout
 *
 * @throws {Error} Throws error when Google login is attempted (not yet implemented)
 *
 * @todo Add form validation feedback integration
 * @todo Consider adding loading states for authentication actions
 */
export default function RegisterCard({
  className = "mx-4 w-full md:w-1/2",
  title = "Welcome",
  description = "Please enter your details",
}: RegisterCardProps) {
  const router = useRouter();
  const handleGoogleLogin = async () => {
    try {
      await signIn("google");
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
