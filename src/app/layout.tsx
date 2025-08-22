import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { QueryErrorBoundary } from "@/components/providers/QueryErrorBoundary";
import { Toaster } from "sonner";

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
            <Toaster position="top-right" richColors closeButton />
          </QueryErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
