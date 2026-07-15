import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { OnboardingBanner } from "@/components/shared/onboarding-banner";
import PubLayoutContainer from "@/components/wrapper/pub-layout-container";
import { userAddressRepository } from "@/di/container";
import { authUtils } from "@/lib/utils/auth.utils.server";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  let userId: string;
  try {
    userId = await authUtils.getUserId();
  } catch {
    redirect("/");
  }

  const userAddresses = await userAddressRepository.findByUserId(userId);
  const needsAddress = userAddresses.length === 0;

  return (
    <PubLayoutContainer>
      {needsAddress && <OnboardingBanner />}
      {children}
    </PubLayoutContainer>
  );
}
