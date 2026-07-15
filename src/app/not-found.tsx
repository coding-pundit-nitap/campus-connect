import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-md w-full">
        <div className="flex justify-center">
          <div className="bg-muted p-4 rounded-full border border-border/40">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-black font-heading tracking-tight text-foreground mt-4">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          We couldn't find the page you were looking for. It might have been
          moved or doesn't exist.
        </p>
        <div className="flex justify-center mt-6">
          <Button
            asChild
            className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm cursor-pointer transition-transform hover:scale-102 active:scale-98"
          >
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
