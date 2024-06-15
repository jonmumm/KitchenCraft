// import { parseAsString } from "next-usequerystate";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { useSend } from "@/hooks/useSend";
import { toast } from "sonner";

export const RecipeAddedToast = ({
  name,
  toastId,
  itemIndex,
}: {
  name: string;
  toastId: string | number;
  itemIndex: number;
}) => {
  const send = useSend();
  return (
    <Card
      className="flex flex-row gap-2 justify-between items-center w-full max-w-[356px] p-2 shadow-xl cursor-pointer"
      variant="locontrast"
    >
      <div className="flex flex-col gap-1 flex-1 w-full">
        <div className="font-semibold">{name}</div>
        <div className="text-muted-foreground text-xs">
          Added to <span className="font-semibold">Selected</span>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <Badge
          onClick={() => {
            toast.dismiss(toastId);
            send({ type: "VIEW_LIST", itemIndex });
          }}
        >
          View
        </Badge>
      </div>
    </Card>
  );
};
