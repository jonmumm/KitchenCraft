"use client";

import { ModeToggle } from "@/components/dark-mode-toggle";
import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { PopoverContent } from "@/components/layout/popover";
import { HasEmailSaved } from "@/components/logic/has-email-saved";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import {
  selectProfileName,
  selectUserEmail,
} from "@/selectors/page-session.selectors";
import { ChefHatIcon, GithubIcon, YoutubeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa";
import { AppInstallContainer } from "./components.client";

export function MainMenu({ className }: { className?: string }) {
  const profileSlug = usePageSessionSelector(selectProfileName);
  const email = usePageSessionSelector(selectUserEmail);

  return (
    <>
      <HasEmailSaved not>
        <Button size="lg" event={{ type: "SIGN_IN" }}>
          Sign In
        </Button>
        <Button size="lg" variant="secondary" event={{ type: "CREATE_ACCOUNT" }}>
          Create Account
        </Button>
      </HasEmailSaved>
      <HasEmailSaved>
        <div className="flex flex-col gap-1 items-center justify-center">
          <Label className="uppercase text-xs font-bold text-accent-foreground">
            Chef
          </Label>
          <div className="flex flex-col gap-2 items-center justify-center">
            {/* <Link href={`/@${profileSlug}`}> */}
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
            </Badge>
            {/* </Link> */}
            <Link
              href={`/@${profileSlug}`}
              className="text-muted-foreground text-xs"
            >
              <span>Free Account</span>
            </Link>
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
        {/* {canInstallPWA && <AppInstall />} */}
        {/* <Separator /> */}
        <div className="flex flex-row items-center justify-between w-full gap-3">
          <Label className="uppercase text-xs font-bold text-accent-foreground">
            Email
          </Label>
          <div className="flex-1 min-w-0 truncate text-right">
            <HasEmailSaved>
              <span className="truncate">{email}</span>
            </HasEmailSaved>
            <HasEmailSaved not>
              <Skeleton className="w-20 h-4" />
            </HasEmailSaved>
          </div>
        </div>
        <Separator />

        {/* <Separator />
          <AsyncRenderFirstValue
            observable={combineLatest([
              usage$,
              quotaLimit$,
              activeSubscription$,
            ])}
            render={([quotaUsage, quotaLimit, activeSub]) => {
              return !activeSub ? (
                <>
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
                  <Separator />
                </>
              ) : (
                <></>
              );
            }}
            fallback={<Skeleton className="h-12 w-full" />}
          /> */}
        {/* <div className="flex flex-row gap-3 items-center justify-between">
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
                            fallback={<Progress value={0} className="w-full" />}
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
        </div> */}
        {/* <Separator />
        <Suspense fallback={null}>
          <RenderFirstValue
            observable={activeSubscription$}
            render={(sub) => {
              return sub ? (
                <>
                  <div className="flex flex-row gap-3 items-center justify-between">
                    <Label className="uppercase text-xs font-bold text-accent-foreground">
                      Billing
                    </Label>
                    <div className="flex-1 flex flex-row justify-end">
                      <Link href="/billing">
                        <Badge variant="secondary">Manage</Badge>
                      </Link>
                    </div>
                  </div>
                  <Separator />
                </>
              ) : (
                <></>
              );
            }}
          />
        </Suspense> */}
        {/* <NotificationsSetting>
          <div className="flex flex-row gap-3 items-center justify-between">
            <Label className="uppercase text-xs font-bold text-accent-foreground">
              Notifications
            </Label>
            <div>
              <NotificationsSwitch />
            </div>
          </div>
          <Separator />
        </NotificationsSetting> */}
      </HasEmailSaved>
      <div className="flex flex-row gap-1 items-center justify-between">
        <Label className="uppercase text-xs font-bold text-accent-foreground flex flex-row gap-1 items-center">
          Theme
        </Label>
        <ModeToggle />
      </div>
      <HasEmailSaved>
        <Separator />
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="text-sm underline text-center"
            event={{ type: "LOGOUT" }}
          >
            Sign Out
          </Button>
        </div>
      </HasEmailSaved>
      <Separator />
      <div className="flex flex-row gap-2 justify-center">
        <div className="flex flex-row justify-center gap-2">
          <Link target="_blank" href="https://discord.gg/2DZYEFjCce">
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
      <div className="flex flex-row gap-1 justify-between">
        <p className="text-xs text-center flex-1">
          © 2023 Open Game Collective, LLC. All rights reserved. This software
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
      </div>
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
      className="text-xs w-full h-fit flex flex-row gap-4 rounded-xl py-2"
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
        <span className="opacity-80 text-md">Download</span>
        <span className="text-lg font-medium">KitchenCraft App</span>
      </div>
    </Button>
  </AppInstallContainer>
);
