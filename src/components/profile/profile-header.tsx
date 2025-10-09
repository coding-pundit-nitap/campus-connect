import { User } from "lucide-react";

export default function CheckoutHeader() {
  return (
    <div className="mb-8 p-4 border border-gray-500 rounded-lg">
      <User className="h-10 w-10 text-green-800 animate-bounce" />
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>
      <p className="text-muted-foreground mt-2">
        View or Change your profile here
      </p>
    </div>
  );
}
