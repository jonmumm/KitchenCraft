"use client";

import { Label } from "@/components/display/label";
import { Progress } from "@/components/feedback/progress";
import { Button } from "@/components/input/button";
import { Textarea } from "@/components/input/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/layout/popover";
import { useChangeEventHandler } from "@/hooks/useChangeEventHandler";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSend } from "@/hooks/useSend";
import { useSubmitEventHandler } from "@/hooks/useSubmitEventHandler";
import { assert, cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import { InfoIcon } from "lucide-react";
import { atom, computed, map } from "nanostores";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PREFERENCE_QUESTIONS_RECORD,
  PreferenceQuestion,
  QuestionId,
  ROOT_QUESTION_IDS,
} from "./constants";

export default function Preferences() {
  const store = usePageSessionStore();
  const router = useRouter();

  const [answers$] = useState(
    map(store.get().context.userSnapshot?.context.preferences!)
  );
  const [isLoading$] = useState(atom(false));
  const [isComplete$] = useState(
    computed(answers$, (answers) => {
      for (const rootQuestionId of ROOT_QUESTION_IDS) {
        const rootQuestion = PREFERENCE_QUESTIONS_RECORD[rootQuestionId];
        const rootAnswer = answers[rootQuestionId];

        // Check if the root question is answered
        if (!rootAnswer) {
          return false;
        }

        // Check if a follow-up question is required and answered
        if (
          "followUpQuestionId" in rootQuestion &&
          rootQuestion.followUpQuestionId &&
          shouldShowFollowUp(rootQuestion, rootAnswer)
        ) {
          const followUpAnswer = answers[rootQuestion.followUpQuestionId];
          if (!followUpAnswer) {
            return false;
          }
        }
      }

      // All required questions are answered
      return true;
    })
  );

  const shouldShowFollowUp = (
    question: PreferenceQuestion,
    answer: string | boolean | string[]
  ) => {
    if (question.type === "boolean") {
      return answer === "Yes";
    } else if (question.type === "multiple-choice") {
      return answer === "Other";
    }
    return false;
  };

  const [currentQuestionId$] = useState(
    computed(answers$, (answers) => {
      for (const rootQuestionId of ROOT_QUESTION_IDS) {
        const rootQuestion = PREFERENCE_QUESTIONS_RECORD[rootQuestionId];
        const rootAnswer = answers[rootQuestionId];

        if (!rootAnswer) {
          return rootQuestionId;
        }

        if (
          "followUpQuestionId" in rootQuestion &&
          rootQuestion.followUpQuestionId &&
          shouldShowFollowUp(rootQuestion, rootAnswer)
        ) {
          const followUpAnswer = answers[rootQuestion.followUpQuestionId];
          if (!followUpAnswer) {
            return rootQuestion.followUpQuestionId;
          }
        }
      }

      // If all questions are answered, return null to trigger navigation
      return null;
    })
  );

  const handleClickNext = () => {
    isLoading$.set(true);
    // window.scrollTo({
    //   top: 0,
    //   behavior: "smooth",
    // });
    router.push("/quiz/interests", { scroll: true });
  };

  // Effect to handle navigation when all questions are answered
  useEffect(() => {
    return currentQuestionId$.listen(() => {
      const currentQuestionId = currentQuestionId$.get();
      if (currentQuestionId === null) {
        isLoading$.set(true);
        // window.scrollTo({
        //   top: 0,
        //   behavior: "smooth",
        // });
        router.push("/quiz/interests", { scroll: true });
      }
    });
  }, [currentQuestionId$, router, isLoading$]);

  const [visibleQuestions$] = useState(
    computed([currentQuestionId$, answers$], (currentQuestionId, answers) => {
      const visibleQuestionIds: QuestionId[] = [];
      let currentIndex = 0;
      let reachedCurrentQuestion = false;

      while (
        currentIndex < ROOT_QUESTION_IDS.length &&
        !reachedCurrentQuestion
      ) {
        const rootQuestionId = ROOT_QUESTION_IDS[currentIndex];
        assert(rootQuestionId, "expected questionId at index " + currentIndex);
        visibleQuestionIds.push(rootQuestionId);

        const rootQuestion = PREFERENCE_QUESTIONS_RECORD[rootQuestionId];
        const rootAnswer = answers[rootQuestionId];

        if (
          rootAnswer &&
          "followUpQuestionId" in rootQuestion &&
          rootQuestion.followUpQuestionId &&
          shouldShowFollowUp(rootQuestion, rootAnswer)
        ) {
          visibleQuestionIds.push(rootQuestion.followUpQuestionId);

          if (rootQuestion.followUpQuestionId === currentQuestionId) {
            reachedCurrentQuestion = true;
            break;
          }
        }

        if (rootQuestionId === currentQuestionId) {
          reachedCurrentQuestion = true;
          break;
        }

        currentIndex++;
      }

      return visibleQuestionIds.map((id) => PREFERENCE_QUESTIONS_RECORD[id]);
    })
  );

  useEffect(() => {
    const scrollToBottom = () => {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 20);
    };

    const unsubscribe = answers$.listen(() => {
      scrollToBottom();
    });

    return () => {
      unsubscribe();
    };
  }, [answers$]);

  const OptionButton = ({
    questionId,
    option,
    isSelected,
  }: {
    questionId: QuestionId;
    option: string;
    isSelected: boolean;
  }) => {
    const send = useSend();
    const handleClick = useCallback(() => {
      send({ type: "CHANGE", name: questionId, value: option });
    }, [send, option, questionId]);

    return (
      <Button
        onClick={handleClick}
        variant={!isSelected ? "outline" : "default"}
        size="xl"
        className="flex-1 text-md justify-center text-center p-4"
      >
        {option}
      </Button>
    );
  };

  const getQuestionNumbering = (
    questionId: QuestionId
  ): { number: number; isFollowUp: boolean } => {
    let count = 0;
    for (const rootId of ROOT_QUESTION_IDS) {
      count++;
      if (rootId === questionId) return { number: count, isFollowUp: false };

      const rootQuestion = PREFERENCE_QUESTIONS_RECORD[rootId];
      if (
        "followUpQuestionId" in rootQuestion &&
        rootQuestion.followUpQuestionId === questionId
      ) {
        return { number: count, isFollowUp: true };
      }
    }
    return { number: count, isFollowUp: false };
  };

  const Question = ({ question }: { question: PreferenceQuestion }) => {
    const answers = useStore(answers$, { keys: [question.id] });
    const currentQuestionId = useStore(currentQuestionId$);
    const questionId = question.id as QuestionId;
    const answer = answers[question.id as QuestionId];
    const send = useSend();
    const isCurrentQuestion = currentQuestionId === questionId;

    useChangeEventHandler(question.id, (e) => {
      answers$.setKey(question.id, e.value);
    });

    const MultipleChoiceQuestion = ({ id }: { id: QuestionId }) => {
      const question = useMemo(() => {
        const question = PREFERENCE_QUESTIONS_RECORD[id];
        assert(question, "expected to find question for id " + id);
        assert("options" in question, "expected options");
        return question;
      }, [id]);

      return (
        <div
          className={cn(
            "flex flex-wrap justify-between gap-2 mt-4",
            question.options.length > 2 ? "flex-col" : ""
          )}
        >
          {question.options.map((option, optionIndex) => (
            <OptionButton
              key={optionIndex}
              questionId={question.id as QuestionId}
              option={option}
              isSelected={answer === option}
            />
          ))}
        </div>
      );
    };

    const TextQuestion = ({ id }: { id: QuestionId }) => {
      const textareaRef = useRef<HTMLTextAreaElement>(null);
      const initialAnswer = answers$.get()[id];
      const [isEmpty$] = useState(atom(!initialAnswer ?? true));

      const handleChange = useCallback(() => {
        const value = textareaRef.current?.value.trim() || "";
        isEmpty$.set(value.length === 0);
      }, [textareaRef, isEmpty$]);

      useSubmitEventHandler(questionId, () => {
        const value = textareaRef.current?.value.trim() || "";
        if (value.length) {
          send({ type: "CHANGE", name: questionId, value });
        }
      });

      const SubmitButton = () => {
        const isEmpty = useStore(isEmpty$);
        return (
          <>
            {isCurrentQuestion && (
              <Button
                event={{ type: "SUBMIT", name: id }}
                className="mt-4 w-full"
                size="xl"
                disabled={isEmpty}
              >
                Submit
              </Button>
            )}
          </>
        );
      };

      return (
        <div className="mt-4">
          <Textarea
            ref={textareaRef}
            onChange={handleChange}
            defaultValue={answer as string}
            placeholder="Type your answer here"
            className="w-full p-2 border rounded"
          />
          <SubmitButton />
        </div>
      );
    };

    const { number, isFollowUp } = getQuestionNumbering(questionId);
    const questionNumberDisplay = isFollowUp ? `${number}a` : `${number}`;

    return (
      <div className="mb-6 w-full" id={`question-${question.id}`}>
        <Label className="text-xs text-muted-foreground uppercase mb-2">
          {questionNumberDisplay} / {ROOT_QUESTION_IDS.length}
        </Label>
        <div className="prose dark:prose-invert">
          <h3 className="font-semibold text-balance flex flex-row gap-2 items-center text-foreground">
            <span>{question.question}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <InfoIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mr-4 p-4 max-w-[80vw]">
                {question.explanation}
              </PopoverContent>
            </Popover>
          </h3>
        </div>

        {question.type === "text" ? (
          <TextQuestion id={question.id} />
        ) : (
          question.options && <MultipleChoiceQuestion id={question.id} />
        )}
      </div>
    );
  };

  const Questions = () => {
    const visibleQuestions = useStore(visibleQuestions$);
    return (
      <>
        {visibleQuestions.map((question) => (
          <Question key={question.id} question={question} />
        ))}
      </>
    );
  };

  const ProgressBar = () => {
    const answers = useStore(answers$);
    const progress =
      (Object.keys(answers).length / ROOT_QUESTION_IDS.length) * 100;
    return <Progress value={progress} className="h-1 w-full" />;
  };

  const StickyCTA = () => {
    const isLoading = useStore(isLoading$);
    const isComplete = useStore(isComplete$);

    return (
      <div className="sticky bottom-0 w-full p-4 max-w-xl mx-auto mb-16">
        {isLoading ? (
          <>
            <Button size="xl" className="w-full" disabled>
              Loading
            </Button>
          </>
        ) : isComplete ? (
          <>
            <Button onClick={handleClickNext} size="xl" className="w-full">
              Next
            </Button>
          </>
        ) : null}
        {/* {isLoading && !isComplete && (
        <Button size="xl" className="w-full" disabled>
          Loading
        </Button>
        )}
        {isComplete && !isLoading && (
        <Button onClick={handleClickNext} size="xl" className="w-full" >
          Next
        </Button>
        )} */}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center relative gap-8 max-w-3xl mx-auto">
      <div className="w-full p-4 sticky top-0 bg-card shadow-xl z-50 rounded-xl">
        <ProgressBar />
      </div>
      <div className="p-6 w-full">
        <Questions />
      </div>
      <StickyCTA />
    </div>
  );
}
