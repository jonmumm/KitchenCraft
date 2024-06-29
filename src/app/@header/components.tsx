import { Button } from "@/components/input/button";

import { Badge } from "@/components/display/badge";
import { BackButton } from "@/components/input/back-button";
import {
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { HasClaimedProfileName } from "@/components/logic/has-claimed-profile-name";
import { TypeLogo } from "@/components/logo";
import NavigationLink from "@/components/navigation/navigation-link";
import { ProfileName } from "@/components/strings/profile-name";
import { getProfileByUserId } from "@/db/queries";
import { getIsMacDesktop, getIsMobile } from "@/lib/headers";
import { MenuSheet } from "@/modules/main-menu/menu-sheet";
import { ArrowLeftIcon, BookmarkIcon, ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { MainMenu } from "../menu/components";
import { CraftInput, MyRecipesBadge } from "./components.client";

export async function HeaderWithInput({ className }: { className?: string }) {
  return (
    <>
      <div className="mx-auto w-full crafting:h-auto relative">
        <HeaderLinks />
        <div
          className={`flex flex-row justify-between items-center gap-3 p-3 max-w-3xl mx-auto`}
        >
          <NavigationLink href="/">
            <TypeLogo className="h-16 crafting:hidden md:absolute md:left-4 md:top-4 transitioning:animate-pulse" />
          </NavigationLink>
          <div className="flex flex-col gap-1 w-full crafting:max-w-3xl crafting:mx-auto">
            <div className="flex flex-row gap-2 w-full justify-between items-center"></div>
            <div className="flex flex-row gap-2 items-center">
              <div className="hidden crafting:flex flex-col gap-3 items-center">
                <BackButton
                  variant={"outline"}
                  size="icon"
                  className="text-xs text-semibold rounded-full"
                >
                  <ArrowLeftIcon />
                </BackButton>
                <Button variant={"outline"} size="icon">
                  <BookmarkIcon />
                </Button>
              </div>
              <CraftCTA initialAutoFocus={!getIsMobile()} />
            </div>
          </div>
        </div>
      </div>
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
        <CraftInput
          initialAutoFocus={initialAutoFocus}
          // autoFocus={autoFocus}
          commandBadge={getIsMacDesktop()}
        />
      </div>
    </>
  );
};

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

export const HeaderLinks = () => {
  return (
    <>
      <div className="hidden crafting:hidden absolute right-4 top-8 lg:flex flex-row h-fit items-center gap-4">
        <div className="flex flex-row gap-1 items-center">
          <div className="flex flex-row gap-1">
            <MyRecipesBadge />
          </div>
        </div>
        <MenuSheet>
          <SheetTrigger>
            <Badge
              variant={"secondary"}
              className="text-md font-semibold whitespace-nowrap cursor-pointer bg-transparent"
            >
              <ChefHatIcon className="mr-1" />
              <HasClaimedProfileName not>Account</HasClaimedProfileName>
              <HasClaimedProfileName>
                <ProfileName />
              </HasClaimedProfileName>
            </Badge>
          </SheetTrigger>
          <SheetOverlay />
          <SheetContent side="right" className="p-4">
            <div className="flex flex-col gap-2 py-4">
              <MainMenu />
            </div>
          </SheetContent>
        </MenuSheet>
      </div>
    </>
  );
};
