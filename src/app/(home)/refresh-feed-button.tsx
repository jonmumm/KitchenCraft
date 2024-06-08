"use client";

import { Button } from "@/components/input/button";
import { useSelector } from "@/hooks/useSelector";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";

export const RefreshFeedButton = () => {
  const context = useAppContext();
  const isRefreshing = useSelector(context, (state) =>
    state.matches({ Feed: { Refreshing: "True" } })
  );

  return (
    <Button
      variant="ghost"
      className="text-xs py-1 px-2 w-fit h-fit flex items-center justify-center"
      disabled={isRefreshing}
      event={{ type: "REFRESH_FEED" }}
    >
      {isRefreshing ? (
        <>
          <Loader2Icon className="mr-1 animate-spin" size={14} />
          Refreshing
        </>
      ) : (
        <>
          <RefreshCwIcon className="mr-1" size={14} />
          Refresh
        </>
      )}
    </Button>
  );
};
