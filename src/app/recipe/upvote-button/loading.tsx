import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { ArrowBigUpDashIcon } from "lucide-react";

export const UpvoteButtonLoading = () => {
  return (
    <Button
      disabled={true}
      variant="outline"
      className="flex flex-row gap-1"
      aria-label="Upvote"
      type="submit"
    >
      <ArrowBigUpDashIcon />
      <span className="font-bold">
        <Skeleton className="w-4 h-4" />
      </span>
    </Button>
  );
};
