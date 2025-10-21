import { PubLayoutContainer } from "@/components/wrapper/layout-container";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PubLayoutContainer>{children}</PubLayoutContainer>;
}
