"use client";

import { ModeToggle } from "@/components/dark-mode-toggle";
import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { EventButton } from "@/components/event-button";
import { Button } from "@/components/input/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { TypeLogo } from "@/components/logo";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import {
  AxeIcon,
  ChefHatIcon,
  ExternalLinkIcon,
  GithubIcon,
  GripVerticalIcon,
  YoutubeIcon,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ActorRefFrom, createMachine } from "xstate";

export const createHeaderMachine = () =>
  createMachine({
    id: "Header",
    type: "parallel",
    types: {
      events: {} as
        | { type: "HIDE" }
        | { type: "SHOW_BACK" }
        | { type: "FOCUS_PROMPT" }
        | { type: "TOGGLE_CONFIGURATOR" },
    },
    on: {
      FOCUS_PROMPT: {
        target: [".Logo.OffScreen", ".Position.Floating"],
      },
      TOGGLE_CONFIGURATOR: {
        target: ".Logo.OffScreen",
      },
    },
    states: {
      Position: {
        initial: "Block",
        states: {
          Block: {},
          Floating: {},
        },
      },
      Back: {
        initial: "Invisible",
        states: {
          Invisible: {},
          Visible: {},
        },
      },
      Logo: {
        initial: "Visible",
        states: {
          OffScreen: {},
          Visible: {},
        },
      },
    },
  });

type HeaderMachine = ReturnType<typeof createHeaderMachine>;
export type HeaderActor = ActorRefFrom<HeaderMachine>;

export const HeaderContext = createContext({} as HeaderActor);

export function Header({
  className,
  hidden,
}: {
  hidden?: boolean;
  className?: string;
}) {
  // const { user } = useContext(UserContext);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const headerActor = useContext(HeaderContext);
  const session = useSession();
  console.log({ session });
  const isBackVisible = useSelector(headerActor, (state) =>
    state.matches("Back.Visible")
  );
  // const session = useSession();

  const pathname = usePathname();
  useEffect(() => {
    setIsPopoverOpen(false);
  }, [pathname, setIsPopoverOpen]);

  const handleClickGoogle = useCallback(() => {
    signIn("google");
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
  }, []);

  // useEventHandler("SIGN_IN", () => {
  //   // supabase.auth.signInWithOAuth({
  //   //   provider: "google",
  //   //   options: {
  //   //     redirectTo: `${window.location.protocol}://${window.location.hostname}/auth/callback`,
  //   //   },
  //   // });
  //   // signIn("google").then(() => {
  //   //   console.log("signed in!");
  //   // });
  // });
  // useEventHandler("SIGN_OUT", () => {
  //   supabase.auth.signOut();
  // });

  const send = useSend();

  const handlePressBack = useCallback(() => {
    send({ type: "BACK" });
  }, [send]);

  return (
    <div
      className={cn(
        `w-full flex items-start justify-between p-4 gap-4 hidden-print ${
          hidden ? "-translate-y-20" : ""
        }`,
        className
      )}
    >
      {/* <div>
        <Button
          onClick={handlePressBack}
          className={!isBackVisible ? "invisible" : ""}
          variant="outline"
        >
          <ArrowBigLeftIcon />
        </Button>
      </div> */}
      <div>
        <Popover
          open={isPopoverOpen}
          onOpenChange={(open) => setIsPopoverOpen(open)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline">
              <GripVerticalIcon
                className={isPopoverOpen ? "transform rotate-90" : ""}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 flex flex-col gap-4 p-3">
            {session.status === "authenticated" && (
              <>
                <div className="flex flex-col gap-1 items-center justify-center">
                  <Label className="uppercase text-xs font-bold text-accent-foreground">
                    Chef
                  </Label>
                  <div className="flex flex-col gap-2 items-center justify-center">
                    <Link href="/chef/inspectorT">
                      <Badge variant="outline">
                        <h3 className="font-bold text-xl">
                          <div className="flex flex-col gap-1 items-center">
                            <div className="flex flex-row gap-1 items-center">
                              <ChefHatIcon />
                              <span>
                                <span className="underline">InspectorT</span>
                              </span>
                            </div>
                          </div>
                        </h3>
                      </Badge>{" "}
                    </Link>
                    {/* <EventButton
                      className="w-full"
                      event={{ type: "SIGN_OUT" }}
                      variant="ghost"
                    >
                      Sign Out
                    </EventButton> */}
                    {/* <Button size="icon" variant="secondary">
                      <EditIcon />
                    </Button> */}
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
                          <span className="font-bold">+30 🧪</span>
                        </div>
                      </Badge>
                      <Label className="uppercase text-xs font-bold text-accent-foreground">
                        30 Days
                      </Label>
                    </div>
                    <div className="flex flex-col gap-1 items-center">
                      <Badge variant="outline">
                        <div className="flex flex-row gap-2 items-center justify-center">
                          <span className="font-bold">+1048 🧪</span>
                        </div>
                      </Badge>
                      <Label className="uppercase text-xs font-bold text-accent-foreground">
                        Lifetime
                      </Label>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-row gap-1 items-center justify-between">
                  <Label className="uppercase text-xs font-bold text-accent-foreground">
                    Email
                  </Label>
                  <div className="flex flex-row gap-2 items-center justify-center">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex flex-row gap-1 items-center">
                        <span>
                          <span>{session.data.user?.email}</span>
                        </span>
                      </div>
                    </div>
                    {/* <Button size="icon" variant="secondary">
                      <EditIcon />
                    </Button> */}
                  </div>
                </div>
                <Separator />
                <div className="flex flex-row gap-1 items-center justify-between">
                  <Label className="uppercase text-xs font-bold text-accent-foreground flex flex-row gap-1 items-center">
                    Theme
                  </Label>
                  <ModeToggle />
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
                <Separator />
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    variant="ghost"
                    className="text-sm underline text-center"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
                <Separator />
              </>
            )}
            {session.status === "unauthenticated" && (
              <>
                {/* <form action={signUp}>
                  <Label htmlFor="email" className="uppercase text-xs opacity-70">Email</Label>
                  <Input type="email" name="email" />
                  <Button type="submit" size="lg" className="w-full">
                    Sign Up
                  </Button>
                  <Separator />
                </form> */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  onClick={handleClickGoogle}
                >
                  Sign In With Google
                </Button>
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
          <AnimatedLogo />
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

const AnimatedLogo = () => {
  const headerActor = useContext(HeaderContext);
  const isLogoOffScreen = useSelector(headerActor, (state) => {
    return state.matches("Logo.OffScreen");
  });
  return <TypeLogo className="h-16" />;
};
