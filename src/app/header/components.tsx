import { Badge } from "@/components/display/badge";
import { Button } from "@/components/input/button";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { MainMenu } from "@/components/modules/main-menu";
import { db } from "@/db";
import {
  getActiveSubscriptionForUserId,
  getProfileByUserId,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { getIsMacDesktop, getUserAgent } from "@/lib/headers";
import { cn } from "@/lib/utils";
import {
  ArrowBigLeftIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  CommandIcon,
  GripVerticalIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Observable, from, map, of, shareReplay } from "rxjs";

export async function Header({
  className,
  showBack,
}: {
  className?: string;
  showBack?: boolean;
}) {

  console.log(showBack);
  return (
    <div
      className={cn(
        `w-full flex justify-between p-4 gap-4 hidden-print items-center`,
        className
      )}
    >
      <div>
        {showBack ? (
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeftIcon />
            </Button>
          </Link>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost">
                <GripVerticalIcon
                // className={isPopoverOpen ? "transform rotate-90" : ""}
                />
              </Button>
            </SheetTrigger>
            <SheetOverlay />
            <SheetContent side="left" className="w-80 flex flex-col gap-4 p-3">
              <MainMenu />
            </SheetContent>
          </Sheet>
        )}
      </div>

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
        {getIsMacDesktop() && <Badge variant="secondary" className="mr-12">
          <CommandIcon size={14} />
          <span style={{ fontSize: "14px" }}>K</span>
        </Badge>}
        <Image
          className="absolute right-0 h-full w-auto cursor-pointer"
          alt="KitchenCraft App Icon"
          width={512}
          height={512}
          src="/apple-touch-icon.png"
        />
      </Button>
    </div>
  );
}

export async function HeaderLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        `w-full flex justify-between py-4 gap-4 hidden-print items-center`,
        className
      )}
    >
      <div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost">
              <GripVerticalIcon className="animate-spin" />
            </Button>
          </SheetTrigger>
          <SheetOverlay />
          <SheetContent side="left" className="w-80 flex flex-col gap-4 p-3">
            <MainMenu />
          </SheetContent>
        </Sheet>
      </div>

      <Button
        disabled
        size="fit"
        variant="ghost"
        className="relative shadow-lg rounded-full flex flex-row py-2 px-6 gap-3 items-center justify-center border-solid border-2 border-muted cursor-text"
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
