import { ModeToggle } from "@/components/dark-mode-toggle";
import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { PopoverContent } from "@/components/layout/popover";
import NavigationLink from "@/components/navigation/navigation-link";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { db } from "@/db";
import {
  getActiveSubscriptionForUserId,
  getMembersBySubscriptionId,
  getProfileByUserId,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { getCanInstallPWA } from "@/lib/headers";
import { cn } from "@/lib/utils";
import {
  ChefHatIcon,
  ChevronRightIcon,
  GithubIcon,
  Loader2Icon,
  YoutubeIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { FaDiscord, FaTwitter } from "react-icons/fa";
import { Observable, from, map, of, shareReplay, switchMap, take } from "rxjs";
import { AppInstallContainer } from "./app-install-container";

export async function MainMenu({ className }: { className?: string }) {
  const session = await getSession();
  const canInstallPWA = getCanInstallPWA();

  const userId = session?.user.id;
  const email = session?.user.email;
  let profileSlug: string | undefined;
  // let stripeCustomerId$: Observable<string | undefined>;
  let activeSubscription$: Observable<
    { id: number; managingUserId: string } | undefined
  >;

  if (userId) {
    profileSlug = (await getProfileByUserId(userId))?.profileSlug;
    // stripeCustomerId$ = from(getStripeCustomerId(db, userId)).pipe(
    //   shareReplay(1)
    // );
    activeSubscription$ = from(getActiveSubscriptionForUserId(db, userId)).pipe(
      shareReplay(1)
    );
  } else {
    // stripeCustomerId$ = of(undefined);
    activeSubscription$ = of(undefined);
  }

  const quotaLimit$ = of(3);
  const usage$ = of(1);
  const memberCount$ = activeSubscription$.pipe(
    switchMap((s) => from(getMembersBySubscriptionId(db, s?.id!))),
    map((members) => members.length),
    take(1)
  );
  const memberCountLimit$ = of(5);

  const NotificationsMenuItem = () => {
    return (
      <>
        <MenuItem className="flex flex-row gap-1 items-center justify-between">
          <Label className="uppercase text-xs font-bold text-accent-foreground flex flex-row gap-1 items-center">
            Notifications
          </Label>
          <NavigationLink
            className="text-sm underline text-center"
            href="/notifications"
          >
            <Button size="icon" variant="ghost">
              <ChevronRightIcon className="transitioning:hidden" />
              <Loader2Icon className="transitioning:block hidden animate-spin" />
            </Button>
          </NavigationLink>
        </MenuItem>
        <Separator />
      </>
    );
  };

  const SubscriptionMemberCountCurrent = () => {
    return (
      <AsyncRenderFirstValue
        observable={memberCount$}
        render={(memberCount) => {
          return <>{memberCount}</>;
        }}
        fallback={<Skeleton className="w-4 h-4" />}
      />
    );
  };

  const SubscriptionMemberCountLimit = () => {
    return (
      <AsyncRenderFirstValue
        observable={memberCountLimit$}
        render={(limit) => {
          return <>{limit}</>;
        }}
        fallback={<Skeleton className="w-4 h-4" />}
      />
    );
  };

  return (
    <>
      {!userId && (
        <>
          {canInstallPWA && (
            <MenuItem>
              <AppInstall />
            </MenuItem>
          )}
          <MenuItem>
            <NavigationLink href="/auth/signin">
              <Button size="lg" className="w-full transitioning:opacity-70">
                <span className="transitioning:hidden">Sign In / Sign Up</span>
                <span className="transitioning:inline hidden">Loading</span>
              </Button>
            </NavigationLink>
          </MenuItem>
          <Separator />
        </>
      )}
      {userId && (
        <>
          <div className="flex flex-col gap-1 items-center justify-center">
            <Label className="uppercase text-xs font-bold text-accent-foreground">
              Chef
            </Label>
            <div className="flex flex-col gap-2 items-center justify-center">
              <Link href={`/me`}>
                <Badge variant="outline">
                  <h3 className="font-bold text-xl">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex flex-row gap-1 items-center">
                        <ChefHatIcon />
                        <span>
                          <span className="underline">{profileSlug}</span>
                        </span>
                      </div>
                    </div>
                  </h3>
                </Badge>{" "}
              </Link>
              {/* <Link
                href={`/@${profileSlug}`}
                className="text-muted-foreground text-xs"
              >
                <span>Inactive</span>
              </Link> */}
            </div>
          </div>
          {/* <div className="flex flex-row gap-8 items-center justify-around">
            <div className="flex flex-row justify-around gap-8">
              <div className="flex flex-col gap-1 items-center">
                <Link href="/leaderboard">
                  <Badge variant="outline">
                    <div className="flex flex-row gap-2 items-center justify-center">
                      <span className="font-bold">
                        +
                        <Suspense
                          fallback={<LoaderIcon className="animate-spin" />}
                        >
                          <RenderFirstValue
                            observable={from(
                              getUserPointsLast30Days(userId)
                            ).pipe(shareReplay(1))}
                            render={(value) => <>{value}</>}
                          />
                        </Suspense>
                        🧪
                      </span>
                    </div>
                  </Badge>
                </Link>
                <Label className="uppercase text-xs font-semibold text-accent-foreground opacity-50">
                  30 Days
                </Label>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <Link href="/leaderboard">
                  <Badge variant="outline">
                    <div className="flex flex-row gap-2 items-center justify-center">
                      <span className="font-bold">
                        +
                        <Suspense
                          fallback={<LoaderIcon className="animate-spin" />}
                        >
                          <RenderFirstValue
                            observable={from(
                              getUserLifetimePoints(userId)
                            ).pipe(shareReplay(1))}
                            render={(value) => <>{value}</>}
                          />
                        </Suspense>
                        🧪
                      </span>
                    </div>
                  </Badge>
                </Link>
                <Label className="uppercase text-xs font-semibold text-accent-foreground opacity-50">
                  Lifetime
                </Label>
              </div>
            </div>
          </div> */}
          <div className="flex flex-row items-center justify-center max-w-full gap-3 text-muted-foreground text-sm">
            <div className="flex-1 min-w-0 truncate text-center">
              <span className="truncate">{email}</span>
            </div>
          </div>

          {canInstallPWA && (
            <MenuItem className="mb-2">
              <AppInstall />
            </MenuItem>
          )}
          <Separator />
          {/* <AsyncRenderFirstValue
            observable={combineLatest([
              usage$,
              quotaLimit$,
              activeSubscription$,
            ])}
            render={([quotaUsage, quotaLimit, activeSub]) => {
              return !activeSub ? (
                <>
                  <MenuItem>
                    <div className="flex flex-row gap-3 items-center justify-between">
                      <Label className="uppercase text-xs font-bold text-accent-foreground">
                        Recipe
                        <br />
                        Quota
                      </Label>
                      <div className="flex flex-col gap-2 flex-1 items-end">
                        <Progress
                          value={(100 * quotaUsage) / quotaLimit}
                          className="w-2/3"
                        />
                        <div className="flex flex-row justify-between items-center w-2/3">
                          <div className="text-muted-foreground text-xs">
                            {quotaUsage}/{quotaLimit} per day
                          </div>

                          <Link href="/history">
                            <div className="text-muted-foreground text-xs underline">
                              History
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </MenuItem>
                  <Separator />
                </>
              ) : (
                <></>
              );
            }}
            fallback={<Skeleton className="h-12 w-full" />}
          /> */}
          {/* <MenuItem className="flex flex-row gap-3 items-center justify-between">
            <Label className="uppercase text-xs font-bold text-accent-foreground">
              Subscription
            </Label>
            <div className="flex-1 flex flex-row justify-end">
              <Suspense>
                <RenderFirstValue
                  observable={activeSubscription$}
                  render={(sub) => {
                    const isManager = userId === sub?.managingUserId;
                    return sub ? (
                      <Link
                        href={isManager ? "/chefs-club/manage" : "/chefs-club"}
                        className="flex flex-col items-end gap-2"
                      >
                        <Badge variant="secondary">Friends & Family</Badge>
                        {isManager && (
                          <div className="flex flex-col gap-2 w-full">
                            <AsyncRenderFirstValue
                              render={([count, limit]) => {
                                return (
                                  <Progress
                                    value={(100 * count) / limit}
                                    className="w-full"
                                  />
                                );
                              }}
                              observable={combineLatest(
                                memberCount$,
                                memberCountLimit$
                              )}
                              fallback={
                                <Progress value={0} className="w-full" />
                              }
                            />

                            <div className="text-muted-foreground text-xs text-right">
                              <SubscriptionMemberCountCurrent />/
                              <SubscriptionMemberCountLimit /> Members
                            </div>
                          </div>
                        )}
                      </Link>
                    ) : (
                      <Link href="/chefs-club">
                        <Badge variant="secondary">Upgrade</Badge>
                      </Link>
                    );
                  }}
                />
              </Suspense>
            </div>
          </MenuItem>
          <Separator /> */}
          {/* <Suspense fallback={null}>
            <RenderFirstValue
              observable={activeSubscription$}
              render={(sub) => {
                return sub ? (
                  <>
                    <MenuItem className="flex flex-row gap-3 items-center justify-between">
                      <Label className="uppercase text-xs font-bold text-accent-foreground">
                        Billing
                      </Label>
                      <div className="flex-1 flex flex-row justify-end">
                        <Link href="/billing">
                          <Badge variant="secondary">Manage</Badge>
                        </Link>
                      </div>
                    </MenuItem>
                    <Separator />
                  </>
                ) : (
                  <></>
                );
              }}
            />
          </Suspense> */}
          {/* <NotificationsSetting>
            <MenuItem className="flex flex-row gap-3 items-center justify-between">
              <Label className="uppercase text-xs font-bold text-accent-foreground">
                Notifications
              </Label>
              <div>
                <NotificationsSwitch />
              </div>
            </MenuItem>
            <Separator />
          </NotificationsSetting> */}
        </>
      )}
      <MenuItem className="flex flex-row gap-1 items-center justify-between">
        <Label className="uppercase text-xs font-bold text-accent-foreground flex flex-row gap-1 items-center">
          Theme
        </Label>
        <ModeToggle />
      </MenuItem>
      <Separator />
      <NotificationsMenuItem />
      {userId && (
        <>
          <MenuItem className="flex flex-row gap-1 items-center justify-between">
            <Label className="uppercase text-xs font-bold text-accent-foreground flex flex-row gap-1 items-center">
              Profile
            </Label>
            <NavigationLink href="/account/edit/profile">
              <Button size="icon" variant="ghost">
                <ChevronRightIcon className="transitioning:hidden" />
                <Loader2Icon className="transitioning:block hidden animate-spin" />
              </Button>
            </NavigationLink>
          </MenuItem>
          <Separator />
          <MenuItem className="flex justify-center">
            <form method="POST" action="/api/auth/signout">
              <Button
                type="submit"
                variant="ghost"
                className="text-sm underline text-center"
              >
                Sign Out
              </Button>
            </form>
          </MenuItem>
          <Separator />
        </>
      )}
      <div className="flex flex-row gap-2 justify-center">
        <div className="flex flex-row justify-center gap-2">
          <Link target="_blank" href="https://www.x.com/kitchencraftAI">
            <Button size="icon" variant="outline">
              <FaTwitter />
            </Button>
          </Link>
          <Link target="_blank" href="https://discord.gg/z2yaxZhzpP">
            <Button size="icon" variant="outline">
              <FaDiscord />
            </Button>
          </Link>
          <Link target="_blank" href="https://github.com/jonmumm/kitchencraft">
            <Button size="icon" variant="outline">
              <GithubIcon />
            </Button>
          </Link>
          <Link target="_blank" href="https://www.youtube.com/@KitchenCraftAI">
            <Button size="icon" variant="outline">
              <YoutubeIcon />
            </Button>
          </Link>
        </div>
      </div>
      <Separator />
      <div className="flex flex-row gap-3 items-center justify-center">
        <Link href="/privacy" className="text-xs underline">
          Privacy
        </Link>
        <Link href="/terms" className="text-xs underline">
          Terms
        </Link>
      </div>
      <MenuItem className="flex flex-row gap-1 justify-between">
        <p className="text-xs text-center flex-1">
          © 2024 Open Game Collective, LLC. All rights reserved. This software
          is distributed under the{" "}
          <Link
            target="_blank"
            className="underline"
            href="https://github.com/jonmumm/KitchenCraft/blob/main/LICENSE.md"
          >
            AGPL-3.0 license
          </Link>
          .
        </p>
      </MenuItem>
    </>
  );
}

const PointsPopoverContent = () => (
  <PopoverContent className="px-3 py-2 text-sm flex flex-col gap-2">
    <div className="text-xs text-foreground-muted text-center italic">
      Earn points via:
    </div>
    <div className="flex flex-row justify-between gap-3">
      <span className="font-semibold">Create Recipe</span>
      <span className="font-medium">+1</span>
    </div>
    <div className="flex flex-row justify-between gap-3">
      <span className="font-semibold">Remix Recipe</span>
      <span className="font-medium">+1</span>
    </div>
    <div className="flex flex-row justify-between gap-3">
      <span className="font-semibold">Upload Photo</span>
      <span className="font-medium">+1</span>
    </div>
    <div className="flex flex-row justify-between gap-3">
      <span className="font-semibold">Receive Upvote</span>
      <span className="font-medium">+1</span>
    </div>
  </PopoverContent>
);

const AppInstall = () => (
  <AppInstallContainer>
    <Button
      className="text-xs h-fit flex flex-row gap-4 rounded-xl p-4 mx-auto shadow-xl group"
      event={{ type: "DOWNLOAD_APP" }}
      variant="outline"
    >
      <Image
        src={"/apple-touch-icon.png"}
        className="h-14 w-14"
        alt={"App Icon"}
        width={512}
        height={512}
      />
      <div className="flex flex-col gap-1 items-center">
        <Badge className="text-blue-600 dark:text-blue-400" variant="secondary">
          <span className="transitioning:hidden">Get</span>
          <Loader2Icon
            size={14}
            className="hidden transitioning:block animate-spin"
          />
        </Badge>
        <span className="text-lg font-medium">KitchenCraft App</span>
      </div>
    </Button>
  </AppInstallContainer>
);

const MenuItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={cn("px-2", className)}>{children}</div>;
};
