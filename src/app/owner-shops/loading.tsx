import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
