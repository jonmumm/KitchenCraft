import { Badge } from "@/components/display/badge";
import { Skeleton } from "@/components/display/skeleton";
import { formatDuration, waitForStoreValue } from "@/lib/utils";
import { ClockIcon } from "lucide-react";
import { MapStore } from "nanostores";
import { Suspense } from "react";
import { StoreProps } from "./schema";

export const Times = ({ store }: { store: MapStore<StoreProps> }) => {
  // const store = useContext(RecipeViewerContext);
  // const { prepTime, cookTime, totalTime } = useStore(store, {
  //   keys: ["prepTime", "cookTime", "totalTime"],
  // });

  const ActiveTime = async () => {
    const prepTime = await waitForStoreValue(store, (state) =>
      state.recipe.cookTime ? state.recipe.activeTime : undefined
    );
    const time = formatDuration(prepTime);
    return <>{time}</>;
  };

  const CookTime = async () => {
    const cookTime = await waitForStoreValue(store, (state) =>
      state.recipe.totalTime ? state.recipe.cookTime : undefined
    );
    const time = formatDuration(cookTime);
    return <>{time}</>;
  };

  const TotalTime = async () => {
    const totalTime = await waitForStoreValue(store, (state) =>
      state.recipe.tags?.length ? state.recipe.totalTime : undefined
    );
    const time = formatDuration(totalTime);
    return <>{time}</>;
  };

  return (
    <div className="flex flex-row gap-2 px-5 py-2 items-center justify-center">
      <ClockIcon className="h-5" />
      <div className="flex flex-row gap-1">
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Cook </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <CookTime />
          </Suspense>
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Active </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <ActiveTime />
          </Suspense>
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Total </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <TotalTime />
          </Suspense>
        </Badge>
      </div>
    </div>
  );
};
