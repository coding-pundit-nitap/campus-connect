import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm font-semibold tracking-wide uppercase">
          Loading...
        </p>
      </div>
    </div>
  );
}
