import { Badge } from "@/components/display/badge";
import { Button } from "@/components/input/button";
import {
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { TypeLogo } from "@/components/logo";
import { MainMenu } from "@/components/modules/main-menu";
import { MenuSheet } from "@/components/modules/main-menu/menu-sheet";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { getIsMacDesktop, getRefererPath } from "@/lib/headers";
import { cn } from "@/lib/utils";
import { ChefHatIcon, ChevronRightIcon, GripVerticalIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton, CraftInput, KeyboardToggle } from "./components.client";

export async function Header({
  className,
  backUrl,
  autoFocus,
}: {
  className?: string;
  backUrl?: string;
  autoFocus?: boolean;
}) {
  const backPath = getRefererPath();
  const hasHistory = !!backPath;
  const userId = await getCurrentUserId();
  const profile = userId ? await getProfileByUserId(userId) : undefined;

  const back = (async (lastUrl?: string) => {
    "use server";
    // todo make this smarter based on url segments nesting
    return redirect(lastUrl || "/");
  }).bind(null, backUrl);

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div
          className={cn(
            `w-full flex justify-between p-4 gap-4 hidden-print items-center group`,
            className
          )}
        >
          <div className="crafting:hidden">
            {backUrl ? (
              <BackButton handleBack={back} hasHistory={hasHistory} />
            ) : (
              <div className="mt-3 mr-2 w-20">
                <Link href="/">
                  <TypeLogo />
                </Link>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 w-full crafting:max-w-3xl crafting:mx-auto">
            {/* <CraftHeading /> */}
            <CraftCTA />
          </div>
          <Link href="/me" className="hidden lg:block crafting:hidden">
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
          {/* <Link href="/leaderboard" className="hidden lg:block crafting:hidden">
            <Button variant="ghost">
              <TrophyIcon />
            </Button>
          </Link> */}
          <div className="crafting:hidden">
            <MenuSheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <GripVerticalIcon />
                </Button>
              </SheetTrigger>
              <SheetOverlay />
              <SheetContent side="right">
                <div className="flex flex-col gap-2 py-4">
                  <MainMenu />
                </div>
              </SheetContent>
            </MenuSheet>
          </div>
          {/* <Card className="flex flex-col items-center justify-center border-none py-2 gap-1 min-w-0">
      </Card> */}
        </div>
      </div>
      <KeyboardToggle />
    </>
  );
}

const CraftHeading = () => {
  return (
    <div className="hidden focus-within:flex flex-row gap-6 items-center">
      {/* <div>
        <Button variant="ghost">
          <ArrowLeftIcon />
        </Button>
      </div> */}
      <div className="flex flex-row gap-3 items-center w-full">
        <div className="flex flex-col gap-1 w-full">
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
  );
};

const CraftCTA = () => {
  // hide the empty state on click

  return (
    <div className="w-full relative shadow-xl rounded-3xl flex flex-row border-2 border-muted py-2 focus-within:border-blue-500">
      <CraftInput
        // autoFocus={autoFocus}
        commandBadge={getIsMacDesktop()}
      />
    </div>
  );

  /* <div className="flex flex-col flex-1 items-start whitespace-nowrap py-2 absolute left-10 top-1 cursor-text select-none">
        <>
          <span className="font-semibold text-md">What to make?</span>
          <div className="flex flex-row gap-1 text-muted-foreground text-xs">
            <span>ingredients</span>
            <span>•</span>
            <span>tags</span>
          </div>
        </>
      </div> */
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
        {/* <Image
          className="absolute right-0 h-full w-auto"
          alt="KitchenCraft App Icon"
          width={512}
          height={512}
          src="/apple-touch-icon.png"
        /> */}
      </Button>
    </div>
  );
}
