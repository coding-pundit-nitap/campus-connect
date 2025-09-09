import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { QueryErrorBoundary } from "@/components/providers/QueryErrorBoundary";
import { QueryProvider } from "@/components/providers/QueryProvider";
import ViewportVhSetter from "@/components/ui/viewport-vh";
import { DatabaseWrapper } from "@/components/wrapper/database-wrapper";
import Layout from "@/components/wrapper/layout-container";
import { OfflineWrapper } from "@/components/wrapper/offline-wrapper";

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <OfflineWrapper>
              <DatabaseWrapper>
                <QueryErrorBoundary>
                  <ViewportVhSetter />
                  <Layout>{children}</Layout>
                  <Toaster position="top-right" richColors closeButton />
                </QueryErrorBoundary>
              </DatabaseWrapper>
            </OfflineWrapper>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
