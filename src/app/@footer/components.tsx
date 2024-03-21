import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import {
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import NavigationLink from "@/components/navigation/navigation-link";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { MenuSheet } from "@/modules/main-menu/menu-sheet";
import {
  ChefHatIcon,
  GripVerticalIcon,
  HomeIcon,
  Loader2Icon,
} from "lucide-react";
import { from, map, of } from "rxjs";
import { MainMenu } from "../menu/components";
import { FooterTabTitle, ReactiveFooter } from "./components.client";

export async function Footer({
  currentTab,
}: {
  currentTab: "profile" | "explore" | "menu" | "leaderboard" | null;
}) {
  const userId = await getCurrentUserId();

  const profileSlug$ = userId
    ? from(getProfileByUserId(userId)).pipe(
        map((profile) => `@${profile?.profileSlug}`)
      )
    : of(undefined);

  // const FooterTabTitle = ({
  //   children,
  //   isActive,
  // }: {
  //   children: ReactNode;
  //   isActive: boolean;
  // }) => {
  //   return (
  //     <span
  //       className={`text-xs ${
  //         isActive
  //           ? `text-blue-700 font-semibold`
  //           : `text-muted-foreground font-medium`
  //       } truncate w-full text-center`}
  //     >
  //       {children}
  //     </span>
  //   );
  // };

  return (
    <ReactiveFooter className="fixed z-20 bottom-0 left-0 right-0 flex rounded-b-none lg:hidden crafting:hidden">
      <div
        className="bg-card w-full border-t-2 border-solid border-slate-50 dark:border-slate-950"
        // style={{ borderTop: "1px solid #777" }}
        // style={{ boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)" }}
      >
        <div className="flex flex-row gap-2 justify-center w-full">
          <NavigationLink href="/" className="basis-36 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1">
              <HomeIcon className="transitioning:hidden" />
              <Loader2Icon className="hidden transitioning:block animate-spin" />
              <FooterTabTitle isActive={currentTab === "explore"}>
                Home
              </FooterTabTitle>
            </Card>
          </NavigationLink>
          <NavigationLink href={"/me"} className="basis-36 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 px-2 gap-1">
              <ChefHatIcon className="transitioning:hidden" />
              <Loader2Icon className="hidden transitioning:block animate-spin" />
              <FooterTabTitle isActive={currentTab === "profile"}>
                <AsyncRenderFirstValue
                  fallback={<Skeleton className="w-20 h-6" />}
                  observable={profileSlug$}
                  render={(slug) => {
                    return <>{slug ? slug : "My Recipes"}</>;
                  }}
                />
              </FooterTabTitle>
            </Card>
          </NavigationLink>
          <MenuSheet>
            <SheetTrigger asChild>
              <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 basis-36 min-w-0">
                <GripVerticalIcon />
                <FooterTabTitle isActive={false}>Settings</FooterTabTitle>
              </Card>
            </SheetTrigger>
            <SheetOverlay />
            <SheetContent side="right" className="p-4">
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
              <CraftTabTitle />
            </Card>
          </CraftTabLink> */}
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
          <NavigationLink href="/" className="basis-36 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1">
              <HomeIcon className="transitioning:hidden" />
              <Loader2Icon className="hidden transitioning:block animate-spin" />
              <Skeleton className="w-8 h-4" />
            </Card>
          </NavigationLink>
          <NavigationLink href={"/me"} className="basis-36 min-w-0">
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
