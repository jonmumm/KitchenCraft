"use client";

import { useSend } from "@/hooks/useSend";
import { ShareIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, ButtonProps } from "./input/button";
import { Popover, PopoverContent, PopoverTrigger } from "./layout/popover";

export const ShareRecipeButton = ({
  slug,
  name,
  className,
  variant,
  showText = true,
}: {
  slug?: string;
  name?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  showText?: boolean;
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
          send({ type: "SHARE_COMPLETE", url: slug });
        })
        .catch(() => {
          send({ type: "SHARE_CANCEL", url: slug });
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
      <Button className={className} variant={variant || "ghost"} disabled>
        {showText && <>Share</>}
        <ShareIcon className="ml-1" />
      </Button>
    );
  }

  return (
    <Popover open={showCopied} onOpenChange={handlePressCopy}>
      <PopoverTrigger asChild>
        <Button
          className={className}
          variant={variant || (!showCopied ? "outline" : "secondary")}
          event={{ type: "SHARE", slug }}
        >
          {showText && <>Share</>}
          <ShareIcon className={showText ? "ml-1" : ""} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit px-2 py-1 z-90">
        URL Copied!
      </PopoverContent>
    </Popover>
  );
};
