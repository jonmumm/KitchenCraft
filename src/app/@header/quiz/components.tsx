import { Separator } from "@/components/display/separator";
import { TypeLogo } from "@/components/logo";
import { sentenceToSlug } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { twc } from "react-twc";

type StepsIndicatorProps = {
  currentStep?: "Intro" | "Experience" | "Preferences" | "Summary";
};

const steps = ["Intro", "Experience", "Preferences", "Summary"];

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep }) => {
  // Function to determine if the step should be highlighted
  const isStepPastOrDone = (step: string) => {
    return currentStep && steps.indexOf(step) <= steps.indexOf(currentStep);
  };

  return (
    <div className="flex flex-col items-stretch py-4 w-full">
      <Link href="/">
        <TypeLogo className="w-24 mx-auto" />
      </Link>
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
      <Separator className="mb-4" />
    </div>
  );
};

export default StepsIndicator;
