"use client";
import Image from "next/image";

import { Button } from "@/components/input/button";
import { Sheet, SheetContent, SheetOverlay } from "@/components/layout/sheet";
import { useEventHandler } from "@/hooks/useEventHandler";
import {
  PlusIcon,
  ShareIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "lucide-react";
import { FC, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

export const SafariInstallPrompt = () => {
  const [installPromptOpen, setInstallPromptOpen] = useState(false);

  const handleDownloadApp = useCallback(() => {
    setInstallPromptOpen(true);
  }, [setInstallPromptOpen]);
  const handleClose = useCallback(() => {
    setInstallPromptOpen(false);
  }, [setInstallPromptOpen]);

  useEventHandler("DOWNLOAD_APP", handleDownloadApp);
  useEventHandler("CLOSE", handleClose);

  return (
    installPromptOpen && (
      <Sheet open={true} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="flex flex-col gap-2 p-4">
          <h2 className="font-medium text-2xl">Add KitchenCraft App</h2>
          <div className="flex flex-row items-center gap-2">
            1. Press{" "}
            <pre
              style={{
                display: "inline-flex",
                border: "1px solid blue",
                alignItems: "center",
                borderRadius: "4px",
                padding: "5x",
                paddingLeft: "10px",
              }}
            >
              Share
              <Button size="icon" disabled variant="outline">
                <ShareIcon />
              </Button>
            </pre>{" "}
          </div>
          <div className="flex flex-row items-center gap-2">
            2. Press{" "}
            <pre
              style={{
                border: "1px solid blue",
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "4px",
                padding: "5x",
                paddingLeft: "10px",
              }}
            >
              Add to Home Screen
              <Button size="icon" variant="outline" disabled>
                <PlusIcon />
              </Button>
            </pre>
          </div>
          <div className="my-3">
            <Image
              style={{
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
              height={1170}
              width={338}
              src="/a2hs_safari.jpg"
              alt="Add to Home Screen Example"
            />
          </div>
          <div className="h-24"></div>
          <PWAInstallViaA2HSAttentionPulse />
        </SheetContent>
        <SheetOverlay />
      </Sheet>
    )
  );
};

const PWAInstallViaA2HSAttentionPulse: FC<{
  className?: string;
  direction?: "up" | "down";
}> = ({ className, direction }) => {
  return (
    <div
      className={cn(
        `absolute bottom-2 flex justify-center left-0 right-0 animate-bounce`,
        className
      )}
    >
      <div>
        {direction === "up" ? <ArrowUpCircleIcon /> : <ArrowDownCircleIcon />}
      </div>
    </div>
  );
};
