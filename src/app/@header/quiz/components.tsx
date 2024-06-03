"use client";

import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { TypeLogo } from "@/components/logo";
import { sentenceToSlug } from "@/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { twc } from "react-twc";

type StepsIndicatorProps = {
  currentStep?: "Intro" | "Experience" | "Preferences" | "Summary";
  showBack?: boolean;
  showSkip?: boolean;
  showSeparator?: boolean;
};

const steps = ["Intro", "Experience", "Preferences", "Summary"];

const StepsIndicator: React.FC<StepsIndicatorProps> = ({
  currentStep,
  showBack,
  showSkip,
  showSeparator = true,
}) => {
  // Function to determine if the step should be highlighted
  const isStepPastOrDone = (step: string) => {
    return currentStep && steps.indexOf(step) <= steps.indexOf(currentStep);
  };
  const router = useRouter();
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <div className="flex flex-col items-stretch mt-4 w-full">
      <div className="flex flex-row justify-between items-center px-4">
        <div className={!showBack ? "invisible" : ""}>
          <Button size="icon" variant="ghost" onClick={handleBack}>
            <ArrowLeftIcon />
          </Button>
        </div>
        <Link href="/">
          <TypeLogo className="w-20 mx-auto" />
        </Link>
        <div className={!showSkip ? "invisible" : ""}>
          <Button variant="ghost">Skip</Button>
        </div>
      </div>
      <ul className="steps text-xs text-muted-foreground my-4 max-w-3xl w-full mx-auto">
        {steps.map((step) => {
          const isDone = isStepPastOrDone(step);
          const Component = isDone ? twc(Link)`` : twc.li``;

          return (
            <Component
              href={`/quiz/${sentenceToSlug(step)}`}
              key={step}
              className={`step ${
                isDone ? "step-neutral text-foreground font-semibold" : ""
              }`}
            >
              {step}
            </Component>
          );
        })}
      </ul>
      {showSeparator && <Separator className="mb-4" />}
    </div>
  );
};

export default StepsIndicator;
