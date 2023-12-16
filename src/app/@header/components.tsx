import { Badge } from "@/components/display/badge";
import { Button } from "@/components/input/button";
import { TypeLogo } from "@/components/logo";
import { env } from "@/env.public";
import { getIsMacDesktop, getReferer } from "@/lib/headers";
import { cn } from "@/lib/utils";
import {
  ChefHatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CommandIcon,
  TrophyIcon,
  XCircleIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton, CraftInput } from "./components.client";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { CommandInput } from "@/components/input/command";

const getLastUrl = async (deviceSessionId: string) => {
  return "/";
};

export async function Header({
  className,
  showBack,
  prompt,
}: {
  className?: string;
  showBack?: boolean;
  prompt?: string;
}) {
  const referer = getReferer();
  const backPath = referer?.split(env.KITCHENCRAFT_URL)[1];
  const hasHistory = !!backPath;
  const userId = await getCurrentUserId();
  const profile = userId ? await getProfileByUserId(userId) : undefined;

  const back = (async (lastUrl?: string) => {
    "use server";
    // todo make this smarter based on url segments nesting
    return redirect(lastUrl || "/");
  }).bind(null, backPath);

  return (
    <div className="group max-w-7xl mx-auto">
      <div
        className={cn(
          `w-full flex justify-between p-4 gap-4 hidden-print items-center`,
          className
        )}
      >
        <div className="group-focus-within:hidden">
          {showBack ? (
            <BackButton handleBack={back} hasHistory={hasHistory} />
          ) : (
            <div className="w-20 mt-3">
              <Link href="/">
                <TypeLogo />
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="hidden group-focus-within:flex flex-row gap-6 items-center">
            <div>
              <Button size="icon" variant="outline">
                <ChevronLeftIcon />
              </Button>
            </div>
            <div className="flex flex-row gap-3 items-center">
              <div className="flex flex-col gap-1">
                <div>
                  <Badge variant="outline">Craft Recipe</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add ingredients, tags, cooking techniques, descriptions.
                </p>
              </div>
              <Image
                className="w-12 aspect-square"
                src="/apple-touch-icon.png"
                alt="KitchenCraft Logo"
                width={512}
                height={512}
              />
            </div>
          </div>
          <CraftCTA prompt={prompt} />
        </div>
        <Link href="/leaderboard" className="hidden lg:block">
          <Button variant="ghost">
            <TrophyIcon />
          </Button>
        </Link>
        <Link href="/me" className="hidden lg:block">
          <div className="flex flex-row gap-1 items-center">
            <div className="flex flex-row gap-1">
              <Badge
                variant="outline"
                className="text-md font-semibold flex flex-row gap-1 whitespace-nowrap"
              >
                <ChefHatIcon />
                <span>
                  {profile?.profileSlug ? profile.profileSlug : "My Recipes"}
                </span>
              </Badge>
            </div>
          </div>
        </Link>
        {/* <Card className="flex flex-col items-center justify-center border-none py-2 gap-1 min-w-0">
      </Card> */}
      </div>
    </div>
  );
}

const CraftCTA = ({ prompt }: { prompt?: string }) => {
  // hide the empty state on click

  return (
    <div className="w-full relative shadow-xl rounded-3xl flex flex-row border-2 border-muted py-2">
      <CraftInput commandBadge={getIsMacDesktop()} />
      {/* <div className="flex flex-col flex-1 items-start whitespace-nowrap py-2 absolute left-10 top-1 cursor-text select-none">
        <>
          <span className="font-semibold text-md">What to make?</span>
          <div className="flex flex-row gap-1 text-muted-foreground text-xs">
            <span>ingredients</span>
            <span>•</span>
            <span>tags</span>
          </div>
        </>
      </div> */}
    </div>
  );

  // return (
  //   <Button
  //     event={{ type: "NEW_RECIPE" }}
  //     size="fit"
  //     variant="ghost"
  //     className="relative shadow-lg rounded-full flex flex-row py-2 px-6 gap-3 items-center justify-center border-solid border-2 border-muted cursor-text"
  //   >
  //     <ChevronRightIcon className="opacity-50 cursor-default" />
  //     <div className="flex flex-col flex-1 items-start whitespace-nowrap">
  //       {!prompt ? (
  //         <>
  //           <span className="font-semibold text-md">What to make?</span>
  //           <div className="flex flex-row gap-1 text-muted-foreground text-xs">
  //             <span>ingredients</span>
  //             <span>•</span>
  //             <span>tags</span>
  //           </div>
  //         </>
  //       ) : (
  //         <>{prompt}</>
  //       )}
  //     </div>
  //     {getIsMacDesktop() && (
  //       <Badge variant="secondary" className="mr-12">
  //         <CommandIcon size={14} />
  //         <span style={{ fontSize: "14px" }}>K</span>
  //       </Badge>
  //     )}
  //     <Image
  //       className="absolute right-0 h-full w-auto cursor-pointer"
  //       alt="KitchenCraft App Icon"
  //       width={512}
  //       height={512}
  //       src="/apple-touch-icon.png"
  //     />
  //   </Button>
  // );
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
      <div className="flex flex-col items-start">
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
