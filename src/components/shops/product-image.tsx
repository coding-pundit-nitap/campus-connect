import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { ImageUtils } from "@/lib/utils-functions";

type ProductImageProps = {
  imageKey: string;
  name: string;
  className?: string;
};

export default function ProductImage({
  imageKey,
  name,
  className = "lg:col-span-5",
}: ProductImageProps) {
  return (
    <div className={`flex flex-col p-0 gap-5 ${className}`}>
      <Card className="sticky py-2 top-6">
        <CardContent className="items-center p-0 justify-center flex gap-4">
          <Image
            src={ImageUtils.getImageUrl(imageKey)}
            width={300}
            height={300}
            alt={name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
