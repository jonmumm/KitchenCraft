"use client";

import { useSend } from "@/hooks/useSend";
import { ShareIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "./input/button";
import { Popover, PopoverContent, PopoverTrigger } from "./layout/popover";

export const ShareButton = ({
  slug,
  name,
}: {
  slug?: string;
  name?: string;
}) => {
  const [showCopied, setShowCopied] = useState(false);
  const send = useSend();

  const handlePressCopy = useCallback(() => {
    if (!slug) {
      return;
    }

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

  if (!slug) {
    return (
      <Button variant="ghost" className="flex-2" disabled size="icon">
        <ShareIcon />
      </Button>
    );
  }

  return (
    <div className="flex-2">
      <Popover open={showCopied} onOpenChange={handlePressCopy}>
        <PopoverTrigger asChild>
          <Button
            variant={!showCopied ? "outline" : "secondary"}
            size="icon"
            event={{ type: "SHARE", slug }}
          >
            <ShareIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit px-2 py-1 z-90">
          URL Copied!
        </PopoverContent>
      </Popover>
    </div>
  );
};
