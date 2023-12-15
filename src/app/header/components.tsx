import { Badge } from "@/components/display/badge";
import { Button } from "@/components/input/button";
import { TypeLogo } from "@/components/logo";
import { env } from "@/env.public";
import { getIsMacDesktop, getReferer } from "@/lib/headers";
import { cn } from "@/lib/utils";
import {
  ChefHatIcon,
  ChevronRightIcon,
  CommandIcon,
  GripIcon,
  GripVerticalIcon,
  TrophyIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton } from "./components.client";
import { Card } from "@/components/display/card";
import { Avatar, AvatarFallback } from "@/components/display/avatar";

const getLastUrl = async (deviceSessionId: string) => {
  return "/";
};

export async function Header({
  className,
  showBack,
}: {
  className?: string;
  showBack?: boolean;
}) {
  const referer = getReferer();
  const backPath = referer?.split(env.KITCHENCRAFT_URL)[1];
  const hasHistory = !!backPath;

  const back = (async (lastUrl?: string) => {
    "use server";
    // todo make this smarter based on url segments nesting
    return redirect(lastUrl || "/");
  }).bind(null, backPath);

  return (
    <div
      className={cn(
        `w-full flex justify-between p-4 gap-4 hidden-print items-center`,
        className
      )}
    >
      <div>
        {showBack ? (
          <BackButton handleBack={back} hasHistory={hasHistory} />
        ) : (
          <div className="w-20">
            <Link href="/">
              <TypeLogo />
            </Link>
          </div>
        )}
      </div>
      <CraftCTA />
      <Link href="/@inspectorT" className="hidden lg:block">
        <div className="flex flex-row gap-1 items-center">
          <div className="flex flex-row gap-1">
            <Badge
              variant="outline"
              className="text-lg font-semibold flex flex-row gap-1"
            >
              <ChefHatIcon />
              <span>inspectorT</span>
            </Badge>
          </div>
        </div>
      </Link>
      <Link href="/leaderboard" className="hidden lg:block">
        <Button variant="ghost">
          <TrophyIcon />
        </Button>
      </Link>
      <Link href="/menu" className="hidden lg:block">
        <Button variant="ghost" className="hidden lg:block">
          <GripVerticalIcon />
        </Button>
      </Link>
      {/* <Card className="flex flex-col items-center justify-center border-none py-2 gap-1 min-w-0">
      </Card> */}
    </div>
  );
}

const CraftCTA = () => {
  return (
    <Button
      event={{ type: "NEW_RECIPE" }}
      size="fit"
      variant="ghost"
      className="relative shadow-lg rounded-full flex flex-row py-2 px-6 gap-3 items-center justify-center border-solid border-2 border-muted cursor-text"
    >
      <ChevronRightIcon className="opacity-50 cursor-default" />
      <div className="flex flex-col flex-1 items-start">
        <span className="font-semibold text-md">What to make?</span>
        <div className="flex flex-row gap-1 text-muted-foreground text-xs">
          <span>ingredients</span>
          <span>•</span>
          <span>tags</span>
        </div>
      </div>
      {getIsMacDesktop() && (
        <Badge variant="secondary" className="mr-12">
          <CommandIcon size={14} />
          <span style={{ fontSize: "14px" }}>K</span>
        </Badge>
      )}
      <Image
        className="absolute right-0 h-full w-auto cursor-pointer"
        alt="KitchenCraft App Icon"
        width={512}
        height={512}
        src="/apple-touch-icon.png"
      />
    </Button>
  );
};

export async function HeaderLoading({
  className,
  showBack,
}: {
  className?: string;
  showBack?: boolean;
}) {
  return (
    <div
      className={cn(
        `w-full flex justify-between py-4 gap-4 hidden-print items-center`,
        className
      )}
    >
      <div>
        <div className="w-20">
          <Link href="/" className="animate-pulse">
            <TypeLogo />
          </Link>
        </div>
      </div>

      <Button
        disabled
        size="fit"
        variant="ghost"
        className="relative shadow-lg rounded-full flex flex-row py-2 px-6 gap-3 items-center justify-center border-solid border-2 border-muted cursor-text animate-pulse"
      >
        <ChevronRightIcon className="opacity-50" />
        <div className="flex flex-col flex-1 items-start">
          <span className="font-semibold text-md">What to make?</span>
          <div className="flex flex-row gap-1 text-muted-foreground text-xs">
            <span>ingredients</span>
            <span>•</span>
            <span>tags</span>
          </div>
        </div>
        <Image
          className="absolute right-0 h-full w-auto"
          alt="KitchenCraft App Icon"
          width={512}
          height={512}
          src="/apple-touch-icon.png"
        />
      </Button>
    </div>
  );
}
