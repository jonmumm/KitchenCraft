"use client";

import { Badge } from "@/components/display/badge";
import AutoResizableTextarea from "@/components/input/auto-resizable-textarea";
import { Button } from "@/components/input/button";
import { getPlatformInfo } from "@/lib/device";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ChevronRight, CommandIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";

export const AppInstallContainer = ({ children }: { children: ReactNode }) => {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const { isInPWA } = getPlatformInfo(navigator.userAgent);
    if (isInPWA) {
      setInstalled(true);
    }
  }, [setInstalled]);

  return !installed ? <>{children}</> : <></>;
};

// Once the client loads, we rely on browser back calls instead of
// form action post to calculate back
export const BackButton = ({
  handleBack,
  hasHistory,
}: {
  handleBack: () => Promise<void>;
  hasHistory: boolean;
}) => {
  const [showLink, setShowLink] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setShowLink(false);
  }, [showLink]);

  const Content = () => (
    <Button
      variant="ghost"
      type="submit"
      onClick={() => {
        if (hasHistory) {
          router.back();
        } else {
          router.push("/");
        }
      }}
    >
      <ArrowLeftIcon />
    </Button>
  );

  return showLink ? (
    <form action={handleBack}>
      <Content />
    </form>
  ) : (
    <Content />
  );
};

export const CraftInput = ({
  commandBadge,
  className,
}: {
  commandBadge: boolean;
  className?: string;
}) => {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/craft");
  }, [router]);

  const handleFocus = useCallback(() => {
    router.push("/craft");
  }, [router]);

  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-center w-full relative",
        className
      )}
    >
      <ChevronRight className="ml-4 h-4 w-4 shrink-0 opacity-50" />
      <AutoResizableTextarea
        placeholderComponent={
          <div className="flex flex-row w-full h-full relative justify-end items-center">
            {commandBadge && (
              <Badge variant="secondary" className="mr-14">
                <CommandIcon size={14} />
                <span style={{ fontSize: "14px" }}>K</span>
              </Badge>
            )}
            <Image
              className="absolute right-[-3px] h-12 w-12 cursor-pointer shadow-lg border-solid border-2 border-slate-500 rounded-full"
              alt="KitchenCraft App Icon"
              width={512}
              height={512}
              src="/apple-touch-icon.png"
            />
          </div>
        }
      />
    </div>
  );
};
