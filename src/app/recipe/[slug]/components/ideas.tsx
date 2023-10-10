import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LightbulbIcon } from "lucide-react";
import { ReactNode, Suspense } from "react";

export async function IdeasHeader() {
  return (
    <div className="flex fex-row gap-2 items-center justify-between w-full p-4">
      <Label className="font-semibold uppercase text-xs">Related Ideas</Label>
      <LightbulbIcon />
    </div>
  );
}

export async function IdeasContent(props: { children?: ReactNode }) {
  return (
    <div className="p-4 w-full">
      <Suspense fallback={<Skeleton className="w-full h-20" />}>
        {props.children}
      </Suspense>
    </div>
  );
}
