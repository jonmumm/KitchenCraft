"use client";

import { Button } from "@/components/input/button";
import { useStore } from "@nanostores/react";
import {
  ArrowBigUpDashIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from "lucide-react";
import { atom } from "nanostores";
import {
  MouseEventHandler,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { RecipeContext } from "./context";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocationHash } from "@/hooks/useLocationHash";
import { z } from "zod";

export const UpvoteButton = (props: { count: number; disabled?: boolean }) => {
  const { upvote } = useContext(RecipeContext);
  const [disabled, setDisabled] = useState(props.disabled);
  const [count$] = useState(atom(props.count));
  const count = useStore(count$);
  const [_, startTransition] = useTransition();

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      setDisabled(true);
      event.preventDefault();
      count$.set(count$.get() + 1);
      startTransition(() => upvote().then());
    },
    [count$, upvote, setDisabled]
  );

  return (
    <form action={upvote}>
      <Button
        disabled={disabled}
        onClick={handleClick}
        variant="outline"
        className="flex flex-row gap-1"
        aria-label="Upvote"
        type="submit"
      >
        <ArrowBigUpDashIcon />
        <span className="font-bold">{count}</span>
      </Button>
    </form>
  );
};
