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
import Link from "next/link";
import { useCallback, useContext, useState } from "react";
import { HomeContext } from "./context";

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
            <Link href="/best?t=today">Today</Link>
          </DropdownMenuItem>
          <Link href="/best?t=week">
            <DropdownMenuItem>This Week</DropdownMenuItem>
          </Link>
          <Link href="/best">
            <DropdownMenuItem>This Month</DropdownMenuItem>
          </Link>
          <Link href="/best?t=year">
            <DropdownMenuItem>This Year</DropdownMenuItem>
          </Link>
          <Link href="/best?t=all">
            <DropdownMenuItem>All Time</DropdownMenuItem>
          </Link>
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
