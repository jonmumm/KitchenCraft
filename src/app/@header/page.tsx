import { Button } from "@/components/input/button";
import { DateTime } from "luxon";

import { Badge } from "@/components/display/badge";
import { Separator } from "@/components/display/separator";
import {
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { TypeLogo } from "@/components/logo";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { getIsMobile, getTimezone } from "@/lib/headers";
import { MenuSheet } from "@/modules/main-menu/menu-sheet";
import { ChefHatIcon, XCircleIcon, XIcon } from "lucide-react";
import { MainMenu } from "../menu/components";
import { CraftCTA } from "./components";
import {
  CurrentListBadge,
  CurrentListButton,
  HomepageSuggestedTokens,
} from "./components.client";

export default async function Page({}) {
  const userId = await getCurrentUserId();
  const profile = userId ? await getProfileByUserId(userId) : undefined;

  return (
    <>
      <div className="mx-auto w-full h-[40vh] crafting:h-auto relative">
        <div className="hidden crafting:hidden absolute right-4 top-8 lg:flex flex-row h-fit items-center gap-4">
          <div className="flex flex-row gap-1 items-center">
            <div className="flex flex-row gap-1">
              <CurrentListBadge />
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
          <Separator orientation="vertical" />
          <MenuSheet>
            <SheetTrigger>
              <Badge
                variant={"secondary"}
                className="text-md font-semibold whitespace-nowrap cursor-pointer bg-transparent"
              >
                <ChefHatIcon className="mr-1" />
                Account
              </Badge>
              {/* <Button variant="ghost" className="rounded"
              
              
              >
                <ChefHatIcon />
                {/* <div className="flex flex-col items-center justify-center">
                  <span className="block">A</span>
                  <span className="block">c</span>
                  <span className="block">c</span>
                  <span className="block">o</span>
                  <span className="block">u</span>
                  <span className="block">n</span>
                  <span className="block">t</span>
                </div> */}
            </SheetTrigger>
            <SheetOverlay />
            <SheetContent side="right" className="p-4">
              <div className="flex flex-col gap-2 py-4">
                <MainMenu />
              </div>
            </SheetContent>
          </MenuSheet>
        </div>
        <div
          className={`flex flex-col h-full justify-between p-2 max-w-3xl mx-auto`}
        >
          <TypeLogo className="h-20 crafting:hidden" />
          <div className="flex flex-col gap-1 w-full crafting:max-w-3xl crafting:mx-auto">
            <PromptHeader />
            <p className="crafting:hidden text-muted-foreground text-sm mb-2 px-2">
              ⚡️ Instantly create personalized recipes.
            </p>
            <div className="flex flex-row gap-2 items-center">
              <CraftCTA initialAutoFocus={!getIsMobile()} />
              <div className="hidden crafting:flex flex-col gap-3 items-center">
                <Button
                  variant={"outline"}
                  size="icon"
                  event={{ type: "CLOSE" }}
                  className="text-xs text-semibold rounded-full"
                >
                  <XIcon />
                </Button>
                <CurrentListButton />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="mx-auto w-full h-[50vh] crafting:h-auto relative"> */}
      <div className="crafting:hidden mt-2 mb-8 max-w-3xl mx-auto px-4">
        <div className="flex flex-row gap-1 items-center flex-wrap">
          <HomepageSuggestedTokens />
        </div>
      </div>
      {/* <KeyboardToggle /> */}
    </>
  );
}

const PromptHeader = () => {
  const timezone = getTimezone(); // Make sure this function returns a valid timezone string
  const currentTime = DateTime.now().setZone(timezone);
  const hour = currentTime.hour;

  let greeting;
  if (hour >= 4 && hour < 9) {
    greeting = "What's for breakfast?";
  } else if (hour >= 9 && hour < 14) {
    greeting = "What's for lunch?";
  } else if (hour >= 14 && hour < 20) {
    greeting = "What's for dinner?";
  } else {
    greeting = "Looking for a snack?";
  }

  return (
    <h2 className="text-2xl font-medium crafting:hidden px-2">{greeting}</h2>
  );
};
