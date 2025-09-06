import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  time: string;
}

interface ShippingOptionsProps {
  options: ShippingOption[];
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

export default function ShippingOptions({
  options,
  selectedMethod,
  onMethodChange,
}: ShippingOptionsProps) {
  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>Shipping Options</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-2 p-3 border-2 border-gray-400 rounded-lg"
            >
              <RadioGroupItem
                className="border-2 border-gray-500"
                value={option.id}
                id={option.id}
              />
              <div className="flex-1">
                <Label htmlFor={option.id} className="font-medium">
                  {option.name}
                </Label>
                <p className="text-sm text-muted-foreground">{option.time}</p>
              </div>
              <span className="font-medium">₹{option.price}</span>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
