import { Button } from "@/components/input/button";
import { DateTime } from "luxon";

import { Badge } from "@/components/display/badge";
import { Card, CardContent, CardHeader } from "@/components/display/card";
import { HighlightContent, HighlightTarget } from "@/components/highlight";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { TypeLogo } from "@/components/logo";
// import { PageSessionSelectorLink } from "@/components/util/page-session-selector-link";
import { getIsMobile, getTimezone } from "@/lib/headers";
// import { selectCurrentSaveToListPath } from "@/selectors/page-session.selectors";
import { BookmarkIcon, InfoIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { CraftCTA, HeaderLinks } from "./components";
import { PromptHighlight } from "./prompt-highlight";

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
              {/* <div className="hidden crafting:flex flex-col gap-3 items-center">
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
              </div> */}
              <PromptHighlight>
                <HighlightTarget>
                  <CraftCTA initialAutoFocus={!getIsMobile()} />
                </HighlightTarget>
                <HighlightContent>
                  Time to create recipes! Type anything you&apos;d like to cook, be
                  as specific as you want!
                </HighlightContent>
              </PromptHighlight>
              <div className="hidden crafting:flex flex-col gap-3 items-center">
                <Button
                  variant={"ghost"}
                  size="icon"
                  event={{ type: "CLOSE" }}
                  className="text-xs text-semibold rounded-full"
                >
                  <XCircleIcon />
                </Button>
                {/* <PageSessionSelectorLink selector={selectCurrentSaveToListPath}> */}
                <Link href="/#liked">
                  <Button variant={"outline"} size="icon">
                    <BookmarkIcon />
                  </Button>
                  {/* </PageSessionSelectorLink> */}
                </Link>
              </div>
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
