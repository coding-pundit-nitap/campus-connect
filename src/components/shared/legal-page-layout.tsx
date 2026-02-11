import { ReactNode } from "react";

export interface LegalPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  lastUpdated?: string;
}

export default function LegalPageLayout({
  children,
  title,
  description,
  lastUpdated = "February 12, 2026",
}: LegalPageLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3">{title}</h1>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
        {lastUpdated && (
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: {lastUpdated}
          </p>
        )}
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  );
}
