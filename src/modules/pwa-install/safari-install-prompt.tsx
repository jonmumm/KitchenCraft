"use client";
import Image from "next/image";

import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { Sheet, SheetContent, SheetOverlay } from "@/components/layout/sheet";
import { useEventHandler } from "@/hooks/useEventHandler";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  PlusSquareIcon,
  ShareIcon,
  XIcon,
} from "lucide-react";
import { FC, useCallback, useState } from "react";

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
        <SheetContent
          side="bottom"
          className="w-full h-full"
          style={{ zIndex: 100 }}
        >
          <div className="flex flex-col justify-end absolute inset-0 gap-3">
            <div className="flex-1 flex justify-end p-4">
              <Button
                variant="outline"
                event={{ type: "CLOSE" }}
              >
                <XIcon />
              </Button>
            </div>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <h1 className="font-semibold text-xl text-center">
                Craft from your Home Screen
              </h1>
              <p className="text-muted-foreground text-sm text-center">
                Get notified about fresh recipes, trends, and bestselling
                products.
              </p>
              <div className="w-24 h-24 mx-auto bg-black rounded-xl shadow-xl">
                <Image
                  alt="KitchenCraft App Icon"
                  width={512}
                  height={512}
                  src="/apple-touch-icon.png"
                />
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 px-4 pb-12">
              <Label className="text-muted-foreground text-xs uppercase">
                Steps To Install
              </Label>
              {/* <div>{currentEmail} {oneTimeToken}</div> */}
              <div className="flex flex-row items-center gap-2">
                1. Press{" "}
                <pre
                  className="border-slate-300 dark:border-slate-700 border-2 border-solid"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "4px",
                    padding: "5x",
                    paddingLeft: "10px",
                  }}
                >
                  Share
                  <Button size="icon" disabled variant="ghost">
                    <ShareIcon />
                  </Button>
                </pre>{" "}
              </div>
              <div className="flex flex-row items-center gap-2">
                2. Press{" "}
                <pre
                  className="border-slate-300 dark:border-slate-700 border-2 border-solid"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "4px",
                    padding: "5x",
                    paddingLeft: "10px",
                  }}
                >
                  Add to Home Screen
                  <Button size="icon" variant="ghost" disabled>
                    <PlusSquareIcon />
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
            </div>
            <PWAInstallViaA2HSAttentionPulse />
          </div>
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
