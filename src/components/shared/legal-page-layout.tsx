import { ArrowLeft, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export interface LegalPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  lastUpdated?: string;
  toc?: { id: string; title: string }[];
}

export default function LegalPageLayout({
  children,
  title,
  description,
  lastUpdated,
  toc,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background">
      <div className="h-64 bg-gradient-to-b from-primary/5 to-transparent absolute top-0 w-full -z-10" />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <ShieldCheck className="w-3 h-3 mr-1.5" />
            Legal & Policy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-4">
            {title}
          </h1>
          {description && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          {lastUpdated && (
            <div className="flex items-center text-sm text-muted-foreground mt-6">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 min-w-0">{children}</div>

          {toc && (
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-2">
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                  On this page
                </h4>
                <nav className="space-y-1 border-l border-border/50 ml-1">
                  {toc.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className="block pl-4 py-2 text-sm text-muted-foreground border-l-2 border-transparent hover:border-primary hover:text-primary transition-colors truncate"
                    >
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
