import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { LinkFromFirstValue } from "@/components/util/link-from-first-value";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { AxeIcon, ChefHatIcon, SearchIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
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
  console.log(currentTab);
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
    <ReactiveFooter className="fixed z-50 bottom-0 left-0 right-0 flex rounded-b-none lg:hidden p-4">
      <div className="bg-card w-full border-muted shadow-2xl border-2 border-solid p-2 rounded-full">
        <div className="flex flex-row gap-2 justify-center w-full">
          <Link href="/" className="basis-32 min-w-0">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1">
              <SearchIcon />
              <FooterTabTitle isActive={currentTab === "explore"}>
                Explore
              </FooterTabTitle>
            </Card>
          </Link>
          <LinkFromFirstValue
            observable={profileSlug$}
            fallbackUrl={"/me"}
            className="basis-32 min-w-0"
          >
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 px-2 gap-1">
              <ChefHatIcon />
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
          </LinkFromFirstValue>
          <Link href="/leaderboard" className="basis-32">
            <Card className="flex flex-col items-center justify-center border-none shadow-none py-2 gap-1 min-w-0">
              <TrophyIcon />
              <FooterTabTitle isActive={currentTab === "leaderboard"}>
                Top Chefs
              </FooterTabTitle>
            </Card>
          </Link>
          <CraftTabLink className="basis-32">
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
