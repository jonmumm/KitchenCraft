import { ModeToggle } from "@/components/dark-mode-toggle";
import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Progress } from "@/components/feedback/progress";
import Image from "next/image";

import { Button } from "@/components/input/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { RenderFirstValue } from "@/components/util/render-first-value";
import { db } from "@/db";
import {
  getActiveSubscriptionForUserId,
  getProfileByUserId,
  getUserLifetimePoints,
  getUserPointsLast30Days,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import Bowser from "bowser";
import { ChefHatIcon, GithubIcon, LoaderIcon, YoutubeIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { Observable, combineLatest, from, of, shareReplay } from "rxjs";
import { AppInstallContainer } from "./app-install-container";

export async function MainMenu({ className }: { className?: string }) {
  const session = await getSession();
  const headerList = headers();
  const browser = Bowser.getParser(headerList.get("user-agent")!);
  const canInstallPWA =
    browser.getOSName() === "iOS" && browser.getBrowserName() === "Safari";

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

  return (
    <>
      {!userId && (
        <>
          <Link href="/auth/signin">
            <Button size="lg" className="w-full">
              Sign In / Sign Up
            </Button>
          </Link>
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
              <Link href={`/@${profileSlug}`}>
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
              <Link
                href={`/@${profileSlug}`}
                className="text-muted-foreground text-xs"
              >
                <span>Inactive</span>
              </Link>
            </div>
          </div>
          <div className="flex flex-row gap-8 items-center justify-around">
            <div className="flex flex-row justify-around gap-8">
              <div className="flex flex-col gap-1 items-center">
                <Popover>
                  <PopoverTrigger asChild>
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
                  </PopoverTrigger>
                  <PointsPopoverContent />
                </Popover>
                <Label className="uppercase text-xs font-bold text-accent-foreground">
                  30 Days
                </Label>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <Popover>
                  <PopoverTrigger asChild>
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
                  </PopoverTrigger>
                  <PointsPopoverContent />
                </Popover>
                <Label className="uppercase text-xs font-bold text-accent-foreground">
                  Lifetime
                </Label>
              </div>
            </div>
          </div>
          <Separator />
          {canInstallPWA && (
            <AppInstallContainer>
              <Button
                className="text-xs w-full h-fit flex flex-row gap-4 rounded-xl py-2"
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
                  <span className="opacity-80 text-md">Download</span>
                  <span className="text-lg font-medium">KitchenCraft App</span>
                </div>
              </Button>
            </AppInstallContainer>
          )}
          <Separator />
          <div className="flex flex-row items-center justify-between max-w-full gap-3">
            <Label className="uppercase text-xs font-bold text-accent-foreground">
              Email
            </Label>
            <div className="flex-1 min-w-0 truncate">
              <span className="truncate">jonathanrmumm+neww@gmail.com</span>
            </div>
          </div>

          <Separator />
          <div className="flex flex-row gap-3 items-center justify-between">
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
                      >
                        <Badge variant="secondary">Friends & Family</Badge>
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
          </div>
          <Separator />
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
          </Suspense>
          <div className="flex flex-row gap-3 items-center justify-between">
            <Label className="uppercase text-xs font-bold text-accent-foreground">
              Quota
            </Label>
            <div className="flex flex-col gap-2 flex-1 items-end">
              <Progress value={20} className="w-2/3" />
              <div className="text-muted-foreground text-xs">1/15</div>
            </div>
          </div>
          <Separator />
        </>
      )}
      <div className="flex flex-row gap-1 items-center justify-between">
        <Label className="uppercase text-xs font-bold text-accent-foreground flex flex-row gap-1 items-center">
          Theme
        </Label>
        <ModeToggle />
      </div>
      {userId && (
        <>
          <Separator />
          <div className="flex justify-center">
            <form method="POST" action="/api/auth/signout">
              <Button
                type="submit"
                variant="ghost"
                className="text-sm underline text-center"
              >
                Sign Out
              </Button>
            </form>
          </div>
        </>
      )}
      <Separator />
      <div className="flex flex-row gap-2 justify-center">
        <div className="flex flex-row justify-center gap-2">
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

// const AnimatedLogo = () => {
//   const headerActor = useContext(HeaderContext);
//   const isLogoOffScreen = useSelector(headerActor, (state) => {
//     return state.matches("Logo.OffScreen");
//   });
//   return <TypeLogo className="h-16" />;
// };

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
