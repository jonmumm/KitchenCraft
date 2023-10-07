"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { ArrowBigLeftIcon, GripVerticalIcon } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";
import { ActorRefFrom, createActor, createMachine } from "xstate";
import { RecentRecipes } from "../components/recent-recipes";

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

export function Header() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const headerActor = useContext(HeaderContext);
  const isBackVisible = useSelector(headerActor, (state) =>
    state.matches("Back.Visible")
  );
  const send = useSend();

  const handlePressBack = useCallback(() => {
    send({ type: "BACK" });
  }, [send]);

  return (
    <div className="absolute left-0 top-0 w-full flex items-start justify-between p-4 gap-4 hidden-print">
      <div className="sticky">
        <Button
          onClick={handlePressBack}
          className={!isBackVisible ? "invisible" : ""}
          variant="outline"
        >
          <ArrowBigLeftIcon />
        </Button>
      </div>

      <div className="flex-1 flex justify-center">
        <AnimatedLogo />
      </div>

      <div className="sticky">
        <Popover onOpenChange={(open) => setIsPopoverOpen(open)}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <GripVerticalIcon
                className={isPopoverOpen ? "transform rotate-90" : ""}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 flex flex-col gap-4 p-3">
            <Link href="/new">
              <Button className="w-full">New Recipe</Button>
            </Link>
            <Separator />
            {/* <RecentRecipes /> */}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

const AnimatedLogo = () => {
  const headerActor = useContext(HeaderContext);
  const isLogoOffScreen = useSelector(headerActor, (state) => {
    return state.matches("Logo.OffScreen");
  });
  return (
    <img
      className={`${
        isLogoOffScreen ? "-translate-y-32 h-2" : "h-16"
      } transition-transform`}
      src="/Logo_TypeOnly_Black.svg"
      alt="KitchenCraft Logo TextOnly"
    />
  );
};
