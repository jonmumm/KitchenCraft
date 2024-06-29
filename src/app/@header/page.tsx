import { Button } from "@/components/input/button";
import { DateTime } from "luxon";

import { Badge } from "@/components/display/badge";
import { Card, CardContent, CardHeader } from "@/components/display/card";
import {
  Highlight,
  HighlightContent,
  HighlightTarget,
} from "@/components/highlight";
import { BackButton } from "@/components/input/back-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { TypeLogo } from "@/components/logo";
import { getIsMobile, getTimezone } from "@/lib/headers";
import { ArrowLeftIcon, BookmarkIcon, InfoIcon } from "lucide-react";
import { CraftCTA, HeaderLinks } from "./components";
import Link from "next/link";

export default async function Page({}) {
  return (
    <>
      <div className="mx-auto w-full h-[48vh] crafting:h-auto relative">
        <HeaderLinks />
        <div
          className={`flex flex-col h-full justify-between p-2 max-w-3xl mx-auto`}
        >
          <TypeLogo className="h-20 crafting:hidden" />
          <div className="flex flex-col gap-1 w-full crafting:max-w-3xl crafting:mx-auto">
            <div className="flex flex-row gap-2 w-full justify-between items-center">
              <div>
                <PromptHeader />
                <p className="crafting:hidden text-muted-foreground text-sm mb-2 px-2">
                  ⚡️ Instantly create personalized recipes.
                </p>
              </div>
              <div className="crafting:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="mr-2">
                      <InfoIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent asChild>
                    <Card className="mr-2 max-w-[95vw]">
                      <CardHeader>
                        Type anything you want in the prompt! Some examples:
                      </CardHeader>
                      <CardContent>
                        <ul>
                          <ExamplePrompt prompt="Cole slaw and gochujang" />
                          <ExamplePrompt prompt="sushi, burrito, fusion dish." />
                          <ExamplePrompt prompt="keto-friendly lasagna recipe." />
                          <ExamplePrompt prompt="2.6 lb pork shoulder, instant pot" />
                          <ExamplePrompt prompt="strawberries basil appetizer." />
                        </ul>
                        <p className="text-muted-foreground text-xs mt-4">
                          Tap one to try it
                        </p>
                      </CardContent>
                    </Card>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="hidden crafting:flex flex-col gap-3 items-center">
                <BackButton
                  variant={"outline"}
                  size="icon"
                  className="text-xs text-semibold rounded-full"
                >
                  <ArrowLeftIcon />
                </BackButton>
                <Link href="?#liked">
                  <Button variant={"outline"} size="icon">
                    <BookmarkIcon />
                  </Button>
                </Link>
              </div>
              <Highlight active={false}>
                <HighlightTarget>
                  <CraftCTA initialAutoFocus={!getIsMobile()} />
                </HighlightTarget>
                <HighlightContent>
                  Teach me something here. Animate the text and play audio. TODO
                  new compoennt
                </HighlightContent>
              </Highlight>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const ExamplePrompt = ({ prompt }: { prompt: string }) => {
  return (
    <li>
      <Badge variant="outline" event={{ type: "NEW_RECIPE", prompt }}>
        {prompt}
      </Badge>
    </li>
  );
};

const PromptHeader = () => {
  const timezone = getTimezone(); // Make sure this function returns a valid timezone string
  const currentTime = DateTime.now().setZone(timezone);
  const hour = currentTime.hour;

  let greeting;
  if (hour >= 4 && hour < 9) {
    greeting = "What's for breakfast?";
  } else if (hour >= 9 && hour < 14) {
    greeting = "What's for lunch?";
  } else if (hour >= 14 && hour < 20) {
    greeting = "What's for dinner?";
  } else {
    greeting = "Looking for a snack?";
  }

  return (
    <h2 className="text-2xl font-medium crafting:hidden px-2">{greeting}</h2>
  );
};
