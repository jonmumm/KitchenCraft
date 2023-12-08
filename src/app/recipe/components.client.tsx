"use client";

import { Button } from "@/components/input/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { useSend } from "@/hooks/useSend";
import { useStore } from "@nanostores/react";
import { ArrowBigUpDashIcon, ShareIcon } from "lucide-react";
import { atom } from "nanostores";
import {
  MouseEventHandler,
  useCallback,
  useContext,
  useState,
  useTransition,
} from "react";
import { RecipeContext } from "./context";

export const UpvoteButton = (props: {
  count: number;
  alreadyVoted: boolean;
}) => {
  const { upvote } = useContext(RecipeContext);
  const [disabled, setDisabled] = useState(props.alreadyVoted);
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

export const ShareButton = ({
  slug,
  name,
  description,
}: {
  slug: string;
  name: string;
  description: string;
}) => {
  const [showCopied, setShowCopied] = useState(false);
  const send = useSend();

  const handlePressCopy = useCallback(() => {
    const { origin } = window.location;
    const url = `${origin}/recipe/${slug}`;

    if ("share" in navigator) {
      navigator
        .share({
          title: name,
          url,
        })
        .then(() => {
          send({ type: "SHARE_COMPLETE", slug });
        })
        .catch(() => {
          send({ type: "SHARE_CANCEL", slug });
        });
    } else if ("clipboard" in navigator) {
      // @ts-ignore
      navigator.clipboard.writeText(url);

      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, 3000);
    }
  }, [setShowCopied, slug, send, name]);

  return (
    <div>
      <Popover open={showCopied} onOpenChange={handlePressCopy}>
        <PopoverTrigger asChild>
          <Button variant="outline" event={{ type: "SHARE", slug }}>
            <ShareIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit px-2 py-1">URL Copied!</PopoverContent>
      </Popover>
    </div>
  );
};
