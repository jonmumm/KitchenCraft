import { Badge } from "@/components/display/badge";
import { Skeleton } from "@/components/display/skeleton";
import { formatDuration } from "@/lib/utils";
import { ClockIcon } from "lucide-react";

export const Times = ({
  cookTime,
  totalTime,
  activeTime,
}: {
  cookTime?: string;
  totalTime?: string;
  activeTime?: string;
}) => {
  // const store = useContext(RecipeViewerContext);
  // const { prepTime, cookTime, totalTime } = useStore(store, {
  //   keys: ["prepTime", "cookTime", "totalTime"],
  // });

  const ActiveTime = () => {
    return <>{formatDuration(activeTime)}</>;
  };

  const CookTime = () => {
    return <>{formatDuration(cookTime)}</>;
  };

  const TotalTime = () => {
    return <>{formatDuration(totalTime)}</>;
  };

  return (
    <div className="flex flex-row gap-2 px-5 py-2 items-center justify-center">
      <ClockIcon size={16} className="h-5" />
      <div className="flex flex-row gap-1">
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Cook </span>
          {cookTime ? (
            <CookTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Active </span>
          {activeTime ? (
            <ActiveTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Total </span>
          {totalTime ? (
            <TotalTime />
          ) : (
            <Skeleton className="w-5 h-4 bg-slate-500" />
          )}
        </Badge>
      </div>
    </div>
  );
};
