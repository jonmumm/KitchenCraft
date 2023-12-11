"use client";

import { Button } from "@/components/input/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { useSend } from "@/hooks/useSend";
import { ShareIcon } from "lucide-react";
import { useCallback, useState } from "react";

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
          <Button
            variant="outline"
            event={{ type: "SHARE", slug }}
            className="w-full"
          >
            <ShareIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit px-2 py-1">URL Copied!</PopoverContent>
      </Popover>
    </div>
  );
};
