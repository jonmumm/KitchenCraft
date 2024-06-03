"use client";

import { Label } from "@/components/display/label";
import { Progress } from "@/components/feedback/progress";
import { Button } from "@/components/input/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useStore } from "@nanostores/react";
import { InfoIcon, Loader2Icon } from "lucide-react";
import { atom } from "nanostores";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { PREFERENCE_QUESTIONS } from "./constants";

const currentIndex$ = atom(0);
const selections$ = atom<Record<number, number>>({});

// Main Preferences component
export default function Preferences() {
  const router = useRouter();
  const selections = useStore(selections$);
  const numSelections = Object.values(selections).length;
  const showNext = numSelections === PREFERENCE_QUESTIONS.length;
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    router.push("/quiz/summary"); // Adjust the navigation route as necessary
    setLoading(true);
  };

  const currentIndex = useStore(currentIndex$);
  useEventHandler("SELECT_QUESTION_OPTION", (event) => {
    PREFERENCE_QUESTIONS[event.questionIndex];
    const currentIndex = currentIndex$.get();

    selections$.set({
      ...selections$.get(),
      [event.questionIndex]: event.optionIndex,
    });

    if (currentIndex < Object.values(selections$.get()).length) {
      currentIndex$.set(currentIndex$.get() + 1);

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 20);
    }
  });

  return (
    <div className="flex flex-col items-center justify-center relative gap-8 mb-16 max-w-3xl mx-auto">
      <div className="w-full p-4 sticky top-0 bg-card shadow-xl z-50 rounded-xl">
        <Progress
          value={(100 / PREFERENCE_QUESTIONS.length) * currentIndex$.get() + 1}
        />
      </div>
      {new Array(Math.min(currentIndex + 1, PREFERENCE_QUESTIONS.length))
        .fill(0)
        .map((_, idx) => {
          return <PreferenceQuestion key={idx} index={idx} />;
        })}
      {showNext && (
        <div className="sticky bottom-0 w-full p-2 flex justify-center">
          <Button
            className="mt-6 py-2 px-4 rounded-xl w-full mb-6 sticky max-w-xl shadow-xl text-lg font-semibold"
            onClick={handleNext}
            size="xl"
            disabled={loading}
          >
            {!loading ? (
              <>Next</>
            ) : (
              <>
                Loading <Loader2Icon className="ml-2 animate-spin" size={14} />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

const PreferenceQuestion = ({ index }: { index: number }) => {
  const question = PREFERENCE_QUESTIONS[index]?.question;
  const options = PREFERENCE_QUESTIONS[index]?.options;

  return (
    <div className="px-4 flex flex-col gap-2 w-full">
      <Label className="text-xs text-muted-foreground uppercase">
        {index + 1}/{PREFERENCE_QUESTIONS.length}
      </Label>
      <div className="prose dark:prose-invert">
        <h2 className="font-semibold text-balance flex flex-row gap-2 items-center text-foreground">
          <span>{question}</span>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <InfoIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mr-4 p-4 max-w-[80vw]">
                {PREFERENCE_QUESTIONS[index]?.explanation}
              </PopoverContent>
            </Popover>
          </div>
        </h2>
      </div>

      <div className="flex justify-between gap-2">
        {options?.map((option, optionIndex) => {
          return (
            <OptionButton
              key={option}
              questionIndex={index}
              optionIndex={optionIndex}
            >
              {option}
            </OptionButton>
          );
        })}
      </div>
    </div>
  );
};

const OptionButton = ({
  questionIndex,
  optionIndex,
  children,
}: {
  questionIndex: number;
  optionIndex: number;
  children: ReactNode;
}) => {
  const selections = useStore(selections$);
  const isSelected = selections[questionIndex] === optionIndex;

  // selections[index];
  return (
    <Button
      event={{
        type: "SELECT_QUESTION_OPTION",
        questionIndex,
        optionIndex,
      }}
      variant={!isSelected ? "outline" : "default"}
      size="xl"
      className="flex-1"
    >
      {children}
    </Button>
  );
};
