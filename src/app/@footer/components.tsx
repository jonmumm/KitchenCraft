import { Card } from "@/components/display/card";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { MainMenu } from "@/components/modules/main-menu";
import {
  ChefHatIcon,
  GripVerticalIcon,
  SearchIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { ReactiveFooter } from "./components.client";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { Skeleton } from "@/components/display/skeleton";
import { from, map, of } from "rxjs";
import { getProfileByUserId } from "@/db/queries";
import { getSession, getUserId } from "@/lib/auth/session";
import { LinkFromFirstValue } from "@/components/util/link-from-first-value";

export async function Footer({
  currentTab,
}: {
  currentTab: "profile" | "explore" | "menu" | "leaderboard" | null;
}) {
  const userId = await getUserId();

  const profileSlug$ = userId
    ? from(getProfileByUserId(userId)).pipe(
        map((profile) => `@${profile?.profileSlug}`)
      )
    : of(undefined);

  const FooterTabTitle = ({
    children,
    isActive,
  }: {
    children: ReactNode;
    isActive: boolean;
  }) => {
    return (
      <span
        className={`text-xs ${
          isActive
            ? `text-blue-700 font-semibold`
            : `text-muted-foreground font-medium`
        } truncate w-full text-center`}
      >
        {children}
      </span>
    );
  };

  return (
    <ReactiveFooter className="fixed z-50 bottom-0 left-0 right-0 shadow-inner flex rounded-b-none lg:hidden">
      <div className="flex flex-row gap-2 justify-center p-4 w-full">
        <Link href="/" className="basis-32 min-w-0">
          <Card className="flex flex-col items-center justify-center border-none py-2 gap-1">
            <SearchIcon />
            <FooterTabTitle isActive={currentTab === "explore"}>
              Explore
            </FooterTabTitle>
          </Card>
        </Link>
        <LinkFromFirstValue
          observable={profileSlug$}
          fallbackUrl={"/sign-up"}
          className="basis-32 min-w-0"
        >
          <Card className="flex flex-col items-center justify-center border-none py-2 px-2 gap-1">
            <ChefHatIcon />
            <FooterTabTitle isActive={currentTab === "profile"}>
              <AsyncRenderFirstValue
                fallback={<Skeleton className="w-20 h-6" />}
                observable={profileSlug$}
                render={(slug) => {
                  return <>{slug ? slug : "Me"}</>;
                }}
              />
            </FooterTabTitle>
          </Card>
        </LinkFromFirstValue>
        <Link href="/leaderboard" className="basis-32">
          <Card className="flex flex-col items-center justify-center border-none py-2 gap-1 min-w-0">
            <TrophyIcon />
            <FooterTabTitle isActive={currentTab === "leaderboard"}>
              Top Chefs
            </FooterTabTitle>
          </Card>
        </Link>
        <Link href="/menu" className="basis-32">
          <Card className="flex flex-col items-center justify-center border-none basis-32 py-2 gap-1 min-w-0">
            <GripVerticalIcon />
            <FooterTabTitle isActive={currentTab === "menu"}>Menu</FooterTabTitle>
          </Card>
        </Link>
      </div>
    </ReactiveFooter>
  );
}
