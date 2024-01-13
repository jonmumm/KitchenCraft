"use client";

import { Badge } from "@/components/display/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/input/dropdown-menu";
import { useEventHandler } from "@/hooks/useEventHandler";
import { UpvoteEvent } from "@/types";
import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { useCallback, useContext, useState } from "react";
import { HomeContext } from "./context";
import NavigationLink from "@/components/navigation/navigation-link";
import { LoadingSpinner } from "@/components/feedback/loading-spinner";

export const BestDropdown = () => {
  const store = useContext(HomeContext);
  const { tab } = useStore(store, { keys: ["tab"] });

  const CurrentTimeParam = () => {
    const { timeParam } = useStore(store, { keys: ["timeParam"] });

    const stringMap = {
      today: "Today",
      week: "This Week",
      month: "This Month", // default
      year: "This Year",
      all: "All Time",
    };

    return <>{timeParam ? stringMap[timeParam] : stringMap.month}</>;
  };

  return tab === "best" ? (
    <Badge variant="outline">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <CurrentTimeParam />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <NavigationLink href="/best?t=today">
              Today
              <LoadingSpinner className={"ml-1"} />
            </NavigationLink>
          </DropdownMenuItem>
          <NavigationLink href="/best?t=week">
            <DropdownMenuItem>
              This Week
              <LoadingSpinner className={"ml-1"} />
            </DropdownMenuItem>
          </NavigationLink>
          <NavigationLink href="/best">
            <DropdownMenuItem>
              This Month
              <LoadingSpinner className={"ml-1"} />
            </DropdownMenuItem>
          </NavigationLink>
          <NavigationLink href="/best?t=year">
            <DropdownMenuItem>
              This Year
              <LoadingSpinner className={"ml-1"} />
            </DropdownMenuItem>
          </NavigationLink>
          <NavigationLink href="/best?t=all">
            <DropdownMenuItem>
              All Time
              <LoadingSpinner className={"ml-1"} />
            </DropdownMenuItem>
          </NavigationLink>
        </DropdownMenuContent>
      </DropdownMenu>
    </Badge>
  ) : null;
};

export const UpvoteCounter = ({
  slug,
  initial,
}: {
  slug: string;
  initial: number;
}) => {
  const [value$] = useState(atom(initial));
  const value = useStore(value$);
  const handleUpvote = useCallback(
    (event: UpvoteEvent) => {
      if (event.slug === slug) {
        value$.set(value$.get() + 1);
      }
    },
    [slug, value$]
  );

  useEventHandler("UPVOTE", handleUpvote);

  return <>{value}</>;
};
