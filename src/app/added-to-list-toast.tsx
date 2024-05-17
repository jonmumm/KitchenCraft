// todo organize this somewhere

import { Badge } from "@/components/display/badge";
import { CardDescription, CardTitle } from "@/components/display/card";

export const AddedToListToast = () => {
  return (
    <div className="flex flex-row gap-2 justify-between w-full">
      <div className="flex-1">
        <CardTitle className="text-md">Added to List</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Card has been added
        </CardDescription>
      </div>
      <div className="flex flex-col justify-center">
        <Badge event={{ type: "VIEW_LIST" }}>View</Badge>
      </div>
    </div>
  );
};
