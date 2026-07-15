import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground px-4">
      <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground" />
      <h2 className="mb-2 text-2xl font-bold">Page Not Found</h2>
      <p className="mb-8 text-muted-foreground text-center">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild variant="default">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
