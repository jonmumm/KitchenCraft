import { ModeToggle } from "@/components/dark-mode-toggle";
import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Progress } from "@/components/feedback/progress";

import { EventButton } from "@/components/event-button";
import { Button } from "@/components/input/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { TypeLogo } from "@/components/logo";
import { RenderFirstValue } from "@/components/util/render-first-value";
import { db } from "@/db";
import {
  getProfileByUserId,
  getStripeCustomerId,
  getUserLifetimePoints,
  getUserPointsLast30Days,
} from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import {
  AxeIcon,
  ChefHatIcon,
  ExternalLinkIcon,
  GithubIcon,
  GripVerticalIcon,
  LoaderIcon,
  YoutubeIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Observable, from, map, of, shareReplay } from "rxjs";

export async function Header({ className }: { className?: string }) {
  const session = await getSession();

  const userId = session?.user.id;
  const email = session?.user.email;
  let profileSlug$: Observable<string | undefined>;
  let stripeCustomerId$: Observable<string | undefined>;

  if (userId) {
    profileSlug$ = from(getProfileByUserId(userId)).pipe(
      shareReplay(1),
      map((profile) => profile?.profileSlug)
    );
    stripeCustomerId$ = from(getStripeCustomerId(db, userId)).pipe(
      shareReplay(1)
    );
  } else {
    profileSlug$ = of(undefined);
    stripeCustomerId$ = of(undefined);
  }

  return (
    <div
      className={cn(
        `w-full flex items-start justify-between p-4 gap-4 hidden-print `,
        className
      )}
    >
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <GripVerticalIcon
              // className={isPopoverOpen ? "transform rotate-90" : ""}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 flex flex-col gap-4 p-3">
            {userId && (
              <>
                <div className="flex flex-col gap-1 items-center justify-center">
                  <Label className="uppercase text-xs font-bold text-accent-foreground">
                    Chef
                  </Label>
                  <div className="flex flex-col gap-2 items-center justify-center">
                    <RenderFirstValue
                      observable={profileSlug$}
                      render={(profileSlug) => {
                        return (
                          <Link href={`/@${profileSlug}`}>
                            <Badge variant="outline">
                              <h3 className="font-bold text-xl">
                                <div className="flex flex-col gap-1 items-center">
                                  <div className="flex flex-row gap-1 items-center">
                                    <ChefHatIcon />
                                    <span>
                                      <span className="underline">
                                        {profileSlug}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </h3>
                            </Badge>{" "}
                          </Link>
                        );
                      }}
                    />
                    <Link href="/chefs-club">
                      <Button
                        variant="secondary"
                        className="flex flex-row gap-1"
                      >
                        <span>Join the </span>
                        <span className="font-semibold">Chef&apos;s Club</span>
                      </Button>
                    </Link>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-row gap-2 items-center justify-between">
                  <Label className="uppercase text-xs text-center font-bold text-accent-foreground">
                    Points
                  </Label>
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col gap-1 items-center">
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
                      <Label className="uppercase text-xs font-bold text-accent-foreground">
                        30 Days
                      </Label>
                    </div>
                    <div className="flex flex-col gap-1 items-center">
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
                      <Label className="uppercase text-xs font-bold text-accent-foreground">
                        Lifetime
                      </Label>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-row gap-3 items-center justify-between">
                  <Label className="uppercase text-xs font-bold text-accent-foreground">
                    Email
                  </Label>
                  <div className="flex flex-row gap-2 items-center justify-center">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex flex-row gap-1 items-center">
                        <span className="truncate">{email}</span>
                      </div>
                    </div>
                    {/* <Button size="icon" variant="secondary">
                      <EditIcon />
                    </Button> */}
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
                        observable={stripeCustomerId$}
                        render={(stripeCustomerId) => {
                          return stripeCustomerId ? (
                            <Link href="/chefs-club/manage">
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
                <div className="flex flex-row gap-3 items-center justify-between">
                  <Label className="uppercase text-xs font-bold text-accent-foreground">
                    Billing
                  </Label>
                  <div className="flex-1 flex flex-row justify-end">
                    <Suspense>
                      <RenderFirstValue
                        observable={stripeCustomerId$}
                        render={(stripeCustomerId) => {
                          return stripeCustomerId ? (
                            <Link href="/billing">
                              <Badge variant="secondary">Manage</Badge>
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
                <div className="flex flex-row gap-3 items-center justify-between">
                  <Label className="uppercase text-xs font-bold text-accent-foreground">
                    Quota
                  </Label>
                  <Progress value={20} />
                </div>
                <Separator />
                <div className="flex flex-row gap-1 items-center justify-between">
                  <Label className="uppercase text-xs font-bold text-accent-foreground flex flex-row gap-1 items-center">
                    Links
                    <ExternalLinkIcon size={16} className="opacity-70" />
                  </Label>
                  <div className="flex flex-row justify-center gap-2">
                    <Link
                      target="_blank"
                      href="https://github.com/jonmumm/kitchencraft"
                    >
                      <Button size="icon" variant="outline">
                        <GithubIcon />
                      </Button>
                    </Link>
                    <Link
                      target="_blank"
                      href="https://www.youtube.com/@KitchenCraftAI"
                    >
                      <Button size="icon" variant="outline">
                        <YoutubeIcon />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
            <Separator />
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
            {!userId && (
              <>
                {/* <form action={signUp}>
                  <Label htmlFor="email" className="uppercase text-xs opacity-70">Email</Label>
                  <Input type="email" name="email" />
                  <Button type="submit" size="lg" className="w-full">
                    Sign Up
                  </Button>
                  <Separator />
                </form> */}
                <Link href="/auth/signin">
                  <Button size="lg" className="w-full">
                    Sign In / Sign Up
                  </Button>
                </Link>
                <Separator />
              </>
            )}
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
                © 2023 Open Game Collective, LLC. All rights reserved. This
                software is distributed under the{" "}
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
            {/* <RecentRecipes /> */}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 flex justify-center">
        <Link href="/">
          <TypeLogo className="h-16" />
        </Link>
      </div>

      <div>
        <EventButton variant="outline" event={{ type: "NEW_RECIPE" }}>
          <AxeIcon />
        </EventButton>
      </div>
    </div>
  );
}

// const AnimatedLogo = () => {
//   const headerActor = useContext(HeaderContext);
//   const isLogoOffScreen = useSelector(headerActor, (state) => {
//     return state.matches("Logo.OffScreen");
//   });
//   return <TypeLogo className="h-16" />;
// };
