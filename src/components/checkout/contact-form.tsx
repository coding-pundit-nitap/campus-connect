import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactFormProps {
  email: string;
  onEmailChange: (email: string) => void;
}

export default function ContactForm({
  email,
  onEmailChange,
}: ContactFormProps) {
  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <Label htmlFor="email" className="m-2">
            Email Address
          </Label>
          <Input
            id="email"
            className="border-gray-500"
            type="email"
            placeholder="xyz@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}
