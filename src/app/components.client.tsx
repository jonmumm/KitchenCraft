"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Button } from "@/components/input/button";
import { useCraftIsOpen, usePromptIsDirty } from "@/hooks/useCraftIsOpen";
import { useSelector } from "@/hooks/useSelector";
import { XIcon } from "lucide-react";
import { Inter } from "next/font/google";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
import { EnterEmailForm } from "./@craft/components.client";
import { CraftContext } from "./context";

const inter = Inter({ subsets: ["latin"] });

export const Body = ({
  children,
  isPWA,
}: {
  children: ReactNode;
  isPWA: boolean;
}) => {
  const craftIsOpen = useCraftIsOpen();
  const promptIsDirty = usePromptIsDirty();

  return (
    <body
      className={`${inter.className} overflow-x-hidden ${
        craftIsOpen ? `crafting` : ``
      }
      ${promptIsDirty ? `prompt-dirty` : ``}

      ${isPWA ? `pwa` : ``}
      `}
      suppressHydrationWarning
    >
      {children}
    </body>
  );
};

export const SearchParamsToastMessage = () => {
  const consumedParamsMapRef = useRef(new Map());
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPathnameRef = useRef(pathname);

  useEffect(() => {
    if (currentPathnameRef.current !== pathname) {
      consumedParamsMapRef.current.clear();
      currentPathnameRef.current = pathname;
    }
  }, [pathname, currentPathnameRef]);

  useEffect(() => {
    if (!consumedParamsMapRef.current.get("message")) {
      consumedParamsMapRef.current.set("message", true);
      const message = searchParams.get("message");
      if (message) {
        toast(message);
      }
    }
  }, [searchParams, consumedParamsMapRef]);

  return <></>;
};

export const SaveRecipeCard = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row gap-1 items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Save Your Recipe</CardTitle>
            <CardDescription>
              Enter your email to save your recipe.
            </CardDescription>
          </div>
          <div className="">
            <Button event={{ type: "CANCEL" }}>
              <XIcon />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EnterEmailForm />
      </CardContent>
    </Card>
  );
};

export const IsInputtingEmail = (props: { children: ReactNode }) => {
  const actor = useContext(CraftContext);
  const isRegistering = useSelector(
    actor,
    (state) =>
      typeof state.value.Auth === "object" &&
      !!state.value.Auth.Registering &&
      state.value.Auth.Registering === "InputtingEmail"
  );
  console.log({ isRegistering });
  return isRegistering ? <>{props.children}</> : null;
};
