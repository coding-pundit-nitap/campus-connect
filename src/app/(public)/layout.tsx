import { PubLayoutContainer } from "@/components/wrapper/pub-layout-container";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PubLayoutContainer>{children}</PubLayoutContainer>;
}
