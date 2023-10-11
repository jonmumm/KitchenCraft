import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, Suspense } from "react";

export async function TipsContent(props: { children?: ReactNode }) {
  return (
    <div className="p-4 w-full">
      <Suspense fallback={<Skeleton className="w-full h-20" />}>
        {props.children}
      </Suspense>
    </div>
  );
}
