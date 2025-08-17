import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { QueryErrorBoundary } from "@/components/providers/QueryErrorBoundary";
<<<<<<< HEAD
import { Toaster } from "sonner";
=======
>>>>>>> 2f09b984263f16e812a819afdddb1bb29a2c00bc

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
<<<<<<< HEAD
            <Toaster position="top-right" richColors closeButton />
=======
>>>>>>> 2f09b984263f16e812a819afdddb1bb29a2c00bc
          </QueryErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
