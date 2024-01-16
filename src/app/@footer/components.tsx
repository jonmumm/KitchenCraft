import { Card } from "@/components/display/card";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import NavigationLink from "@/components/navigation/navigation-link";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { AxeIcon, ChefHatIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { from, map, of } from "rxjs";
import {
  CraftTabLink,
  CraftTabTitle,
  FooterTabTitle,
  ReactiveFooter,
} from "./components.client";

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
    <ReactiveFooter className="fixed z-20 bottom-0 left-0 right-0 flex rounded-b-none lg:hidden p-4 crafting:hidden">
      <div className="bg-card w-full border-muted shadow-2xl border-2 border-solid p-2 rounded-full">
        <div className="flex flex-row gap-2 justify-center w-full">
          <NavigationLink href="/" className="basis-36 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1">
              <SearchIcon className="transitioning:hidden" />
              <Loader2Icon className="hidden transitioning:block animate-spin" />
              <FooterTabTitle isActive={currentTab === "explore"}>
                Explore
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
          {/* <Link href="/leaderboard" className="basis-36">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 min-w-0">
              <TrophyIcon />
              <FooterTabTitle isActive={currentTab === "leaderboard"}>
                Top Chefs
              </FooterTabTitle>
            </Card>
          </Link> */}
          <CraftTabLink className="basis-36">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 min-w-0">
              <AxeIcon />
              <CraftTabTitle />
            </Card>
          </CraftTabLink>
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
              <SearchIcon className="transitioning:hidden" />
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
          {/* <Link href="/leaderboard" className="basis-36">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 min-w-0">
              <TrophyIcon />
              <FooterTabTitle isActive={currentTab === "leaderboard"}>
                Top Chefs
              </FooterTabTitle>
            </Card>
          </Link> */}
          <CraftTabLink className="basis-36">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 min-w-0">
              <AxeIcon />
              <Skeleton className="w-8 h-4" />
            </Card>
          </CraftTabLink>
        </div>
      </div>
    </ReactiveFooter>
  );
}
