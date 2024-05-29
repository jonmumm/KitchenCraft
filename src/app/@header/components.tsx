import { MainMenu } from "@/app/menu/components";
import { Button } from "@/components/input/button";
import {
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { TypeLogo } from "@/components/logo";
import NavigationLink from "@/components/navigation/navigation-link";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { getIsMacDesktop, getRefererPath } from "@/lib/headers";
import { cn } from "@/lib/utils";
import { MenuSheet } from "@/modules/main-menu/menu-sheet";
import {
  ChefHatIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  ListIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddedTokens, HasTokens } from "../@craft/components.client";
import {
  BackButton,
  CraftInput,
  MyRecipesBadge,
  KeyboardToggle,
} from "./components.client";

export async function HeaderWithInput({
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
      <div className="max-w-7xl mx-auto w-full">
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
                <NavigationLink href="/">
                  <div className="transitioning:animate-pulse">
                    <TypeLogo />
                  </div>
                </NavigationLink>
              </div>
            )}
          </div>
          <div className="flex flex-row gap-1 w-full crafting:max-w-3xl crafting:mx-auto">
            <CraftCTA />
          </div>
          <div className="hidden crafting:block">
            <Button variant={"ghost"} event={{ type: "VIEW_LIST" }}>
              <ListIcon />
            </Button>
            {/* <Button variant={"ghost"} event={{ type: "CLOSE" }}>
              Close
            </Button> */}
          </div>
          <div className="hidden crafting:hidden right-4 top-8 lg:flex flex-row h-fit items-center gap-4">
            <div className="flex flex-row gap-1 items-center">
              <div className="flex flex-row gap-1">
                <MyRecipesBadge />
              </div>
            </div>
            <MenuSheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <GripVerticalIcon />
                </Button>
              </SheetTrigger>
              <SheetOverlay />
              <SheetContent side="right" className="p-4">
                <div className="flex flex-col gap-2 py-4">
                  <MainMenu />
                </div>
              </SheetContent>
            </MenuSheet>
          </div>
          {/* <Link href="/leaderboard" className="hidden lg:block crafting:hidden">
            <Button variant="ghost">
              <TrophyIcon />
            </Button>
          </Link> */}
          {/* <div className="crafting:hidden">
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
          </div> */}
          {/* <Card className="flex flex-col items-center justify-center border-none py-2 gap-1 min-w-0">
      </Card> */}
        </div>
      </div>
      <KeyboardToggle />
    </>
  );
}

export const CraftCTA = ({
  initialAutoFocus,
}: {
  initialAutoFocus?: boolean;
}) => {
  // hide the empty state on click

  return (
    <>
      <div className="w-full relative shadow-xl rounded-xl py-2 flex flex-col border-2 border-muted focus-within:border-blue-500 active:border-blue-300 gap-2">
        {/* <CraftPromptNotEmpty>
        <CraftAutoComplete />
      </CraftPromptNotEmpty> */}
        <HasTokens>
          <AddedTokens />
        </HasTokens>
        <CraftInput
          initialAutoFocus={initialAutoFocus}
          // autoFocus={autoFocus}
          commandBadge={getIsMacDesktop()}
        />
      </div>
    </>
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

export default function BasicHeader({
  profile,
}: {
  profile?: Awaited<ReturnType<typeof getProfileByUserId>>;
}) {
  // const userId = await getCurrentUserId();
  // const profile = userId ? await getProfileByUserId(userId) : undefined;
  return (
    <div className="relative">
      <Link href="/" className={`flex flex-col h-full justify-center p-4`}>
        <TypeLogo className="h-20 crafting:hidden" />
      </Link>
      <div className="hidden crafting:hidden absolute right-4 top-8 lg:flex flex-row h-fit items-center gap-4">
        <div className="flex flex-row gap-1 items-center">
          <div className="flex flex-row gap-1">
            <MyRecipesBadge />
            {/* <Badge
                variant="outline"
                className="text-md font-semibold flex flex-row gap-1 whitespace-nowrap"
              >
                <ChefHatIcon className="transitioning:hidden" />
                <Loader2Icon className="hidden transitioning:block animate-spin" />
                <span>
                  {profile?.profileSlug ? profile.profileSlug : "My Cookbook"}
                </span>
              </Badge> */}
          </div>
        </div>
        <MenuSheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChefHatIcon />
              Account
            </Button>
          </SheetTrigger>
          <SheetOverlay />
          <SheetContent side="right" className="p-4">
            <div className="flex flex-col gap-2 py-4">
              <MainMenu />
            </div>
          </SheetContent>
        </MenuSheet>
      </div>
    </div>
  );
}
