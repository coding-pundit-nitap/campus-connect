import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { QueryErrorBoundary } from "@/components/providers/QueryErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "College Connect",
  description: "Connecting students and staff for better education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <QueryErrorBoundary>
            {children}
          </QueryErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
