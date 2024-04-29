import { Separator } from "@/components/display/separator";
import { sentenceToSlug } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { twc } from "react-twc";

type StepsIndicatorProps = {
  currentStep?: "Experience" | "Taste" | "Diet" | "Equipment";
};

const steps = ["Experience", "Taste", "Diet", "Equipment"];

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep }) => {
  // Function to determine if the step should be highlighted
  const isStepPastOrDone = (step: string) => {
    return currentStep && steps.indexOf(step) <= steps.indexOf(currentStep);
  };

  return (
    <>
      <ul className="steps text-xs text-muted-foreground my-4">
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
    </>
  );
};

export default StepsIndicator;
