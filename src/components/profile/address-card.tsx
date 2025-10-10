import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const addressCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl lg:text-2xl font-semibold">
          Address :
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="shadow-sm p-2 rounded-sm">
          shiv colony palla no. 1 faridabad haryana this is the territoy region
        </p>
        <p className="shadow-sm p-2">Card Content</p>
        <p className="shadow-sm p-2">Card Content</p>
        <p className="shadow-sm p-2">Card Content</p>
      </CardContent>
    </Card>
  );
};

export default addressCard;
