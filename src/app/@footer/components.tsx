import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import {
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { ListIndicator } from "@/components/list-indicator";
import { HasClaimedProfileName } from "@/components/logic/has-claimed-profile-name";
import NavigationLink from "@/components/navigation/navigation-link";
import { ProfileName } from "@/components/strings/profile-name";
import { MenuSheet } from "@/modules/main-menu/menu-sheet";
import {
  BookmarkIcon,
  CheckCircleIcon,
  ChefHatIcon,
  GripVerticalIcon,
  HomeIcon,
  Loader2Icon,
} from "lucide-react";
import Link from "next/link";
import { MainMenu } from "../menu/components";
import { FooterTabTitle, ReactiveFooter } from "./components.client";

export async function Footer({
  currentTab,
}: {
  currentTab: "profile" | "explore" | "menu" | "leaderboard" | null;
}) {
  return (
    <ReactiveFooter className="fixed z-20 bottom-0 left-0 right-0 flex rounded-b-none lg:hidden crafting:hidden">
      <div className="bg-card w-full border-t-2 border-solid border-slate-200 dark:border-slate-800 standalone:pb-4">
        <div className="flex flex-row gap-4 justify-center w-full">
          <NavigationLink href="/" className="basis-24 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1">
              <HomeIcon className="transitioning:hidden" />
              <Loader2Icon className="hidden transitioning:block animate-spin" />
              <FooterTabTitle isActive={currentTab === "explore"}>
                Home
              </FooterTabTitle>
            </Card>
          </NavigationLink>
          {/* // todo make dynamic */}
          <div className="basis-24 min-w-0">
            <Link href="#liked">
              <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 px-2 gap-1">
                <div className="indicator">
                  {/* <ListIndicator /> */}
                  <BookmarkIcon />
                </div>
                <FooterTabTitle isActive={false}>Saved</FooterTabTitle>
              </Card>
            </Link>
          </div>
          <MenuSheet>
            <SheetTrigger asChild>
              <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 basis-24 min-w-0 max-w-full">
                <ChefHatIcon />
                <FooterTabTitle isActive={false}>
                  <HasClaimedProfileName not>Account</HasClaimedProfileName>
                  <HasClaimedProfileName>
                        <ProfileName />
                  </HasClaimedProfileName>
                </FooterTabTitle>
              </Card>
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
    </ReactiveFooter>
  );
}

export async function FooterPlaceholder() {
  return (
    <ReactiveFooter className="fixed z-20 bottom-0 left-0 right-0 flex rounded-b-none lg:hidden p-4 crafting:hidden">
      <div className="bg-card w-full border-muted shadow-2xl border-2 border-solid p-2 rounded-full">
        <div className="flex flex-row gap-2 justify-center w-full">
          <NavigationLink href="/" className="basis-24 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1">
              <HomeIcon className="transitioning:hidden" />
              <Loader2Icon className="hidden transitioning:block animate-spin" />
              <Skeleton className="w-8 h-4" />
            </Card>
          </NavigationLink>
          <NavigationLink href={"/me"} className="basis-24 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 px-2 gap-1">
              <ChefHatIcon className="transitioning:hidden" />
              <Loader2Icon className="hidden transitioning:block animate-spin" />
              <Skeleton className="w-8 h-4" />
            </Card>
          </NavigationLink>

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
          {/* <Link href="/leaderboard" className="basis-36">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 min-w-0">
              <TrophyIcon />
              <FooterTabTitle isActive={currentTab === "leaderboard"}>
                Top Chefs
              </FooterTabTitle>
            </Card>
          </Link> */}
          {/* <CraftTabLink className="basis-36">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 min-w-0">
              <AxeIcon />
              <Skeleton className="w-8 h-4" />
            </Card>
          </CraftTabLink> */}
        </div>
      </div>
    </ReactiveFooter>
  );
}
