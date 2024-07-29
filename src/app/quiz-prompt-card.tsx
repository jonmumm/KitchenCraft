"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/display/card";
import { Button } from "@/components/input/button";
import NavigationLink from "@/components/navigation/navigation-link";
import { Loader2Icon, XIcon } from "lucide-react";

export const QuizPromptCard = () => {
  return (
    <Card>
      <CardHeader className="relative flex flex-row justify-between gap-2">
        <div>
          <CardTitle>Take The Quiz</CardTitle>
          <CardDescription className="mt-2">
            Tell KitchenCraft about your cooking goals, preferences, and
            interests to personalize your experience.
          </CardDescription>
        </div>
        <div>
          <Button event={{ type: "CANCEL" }} variant="ghost" autoFocus={false}>
            <XIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <NavigationLink href="/quiz">
          <Button
            variant="primary"
            className="w-full transitioning:opacity-40"
            size="xl"
          >
            <span>Start Quiz</span>
            <Loader2Icon
              size={14}
              className="animate-spin hidden transitioning:inline-block ml-2"
            />
          </Button>
        </NavigationLink>
      </CardContent>
    </Card>
  );
};
