import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShippingFormProps {
  firstName: string;
  lastName: string;
  address: string;
  onFirstNameChange: (firstName: string) => void;
  onLastNameChange: (lastName: string) => void;
  onAddressChange: (address: string) => void;
}

export default function ShippingForm({
  firstName,
  lastName,
  address,
  onFirstNameChange,
  onLastNameChange,
  onAddressChange,
}: ShippingFormProps) {
  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="m-2">
              First Name
            </Label>
            <Input
              id="firstName"
              className="border-gray-500"
              placeholder="XYZ"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="m-2">
              Last Name
            </Label>
            <Input
              id="lastName"
              className="border-gray-500"
              placeholder="xyz"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="address" className="m-2">
            Address
          </Label>
          <Input
            id="address"
            className="border-gray-500"
            placeholder="Hostel Name"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}
