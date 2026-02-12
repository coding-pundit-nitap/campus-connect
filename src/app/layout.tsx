import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { QueryErrorBoundary } from "@/components/providers/QueryErrorBoundary";
import { QueryProvider } from "@/components/providers/QueryProvider";
import ViewportVhSetter from "@/components/ui/viewport-vh";
import { DatabaseWrapper } from "@/components/wrapper/database-wrapper";
import { OfflineWrapper } from "@/components/wrapper/offline-wrapper";
import { defaultMetadata } from "@/lib/metadata/site-metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0a0a0a"
          media="(prefers-color-scheme: dark)"
        />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Campus Connect" />

        <link rel="manifest" href="/manifest.json" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <meta
          name="google-site-verification"
          content="ta5Z5jlyjpLChhWGQp8OmWxPt_IocPfwT8MEcYMrOhg"
        />

        <link rel="dns-prefetch" href="//connect.nitap.ac.in" />
        <link rel="preconnect" href="//connect.nitap.ac.in" />
      </head>
      <body className={inter.className}>
        <noscript>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div>
              <h1>Campus Connect</h1>
              <p>
                Hyper-local e-commerce platform connecting campus vendors with
                students. Order from your favorite campus shops and get batch
                delivery to your hostel.
              </p>
              <p style={{ marginTop: "1rem", color: "#666" }}>
                Please enable JavaScript to use Campus Connect.
              </p>
            </div>
          </div>
        </noscript>
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
                  {children}
                </QueryErrorBoundary>
              </DatabaseWrapper>
            </OfflineWrapper>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
