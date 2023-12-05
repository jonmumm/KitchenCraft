"use client";

import { Badge } from "@/components/display/badge";
import { CardContent } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemClearPrompt,
} from "@/components/input/command";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useStore } from "@nanostores/react";
import { useCommandState } from "cmdk";
import { HelpCircle, ThumbsDown, ThumbsUpIcon } from "lucide-react";
import { listenKeys } from "nanostores";
import { usePathname } from "next/navigation";
import {
  ComponentProps,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import {
  useCurrentAnswer,
  useCurrentQuestion,
  useDirty,
  useLoading,
  usePrompt,
} from "./hooks";
import { store } from "./store";

const getSousChefEventSource = (slug: string, prompt: string) => {
  const eventSourceUrl = `/api/recipe/${slug}/sous-chef?prompt=${prompt}`;
  return new EventSource(eventSourceUrl);
};

export const SousChefCommand = ({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) => {
  useEffect(() => {
    return listenKeys(store, ["history"], (state) => {
      const { history, index } = store.get();
      const item = history[index];

      // When we submit, if we we have a prompt and arent already loading
      // ...start loading
      if (item && item.question && !state.loading) {
        store.setKey("index", index + 1);
        store.setKey("loading", true);
        const source = getSousChefEventSource(slug, item.question);
        const chunks: string[] = [];
        let resultId: string | null = null;
        source.onmessage = (event) => {
          if (!resultId) {
            resultId = event.data;
            return;
          }

          const chunk = z.string().parse(JSON.parse(event.data));
          chunks.push(chunk);
          store.setKey(`history[${index}].answer`, chunks.join(""));
        };

        source.onerror = () => {
          // ends with error when server closes writer
          // store.setKey("index", store.get().index + 1);
          store.setKey("loading", false);
          if (source.readyState !== source.CLOSED) {
            source.close();
          }
          // setTimeout(() => {
          //   store.get().inputRef.current?.focus();
          // }, 50);
        };
      }
    });
  }, [slug]);

  return <Command shouldFilter={false}>{children}</Command>;
};

// todo make generic
export const SousChefCommandResult = ({
  resultIterator,
}: {
  resultIterator: () => Promise<{ result: string; more: boolean }>;
}) => {
  const [result, setResult] = useState("");
  const mountedRef = useRef(true);
  useEffect(() => {
    const process = () => {
      resultIterator().then(({ result, more }) => {
        if (!mountedRef.current) return;
        setResult(result);
        if (more) process();
      });
    };

    process();

    return () => {
      mountedRef.current = false;
    };
  }, [resultIterator, setResult]);
  return <>{result}</>;
};

export const SousChefFAQSuggestionsCommandGroup = (
  props: ComponentProps<typeof CommandGroup>
) => {
  const prompt = usePrompt();

  return !prompt?.length ? <CommandGroup {...props} /> : null;
};

export const SousChefCommandItem = ({
  children,
  ...props
}: ComponentProps<typeof CommandItem>) => {
  const loading = useLoading();
  const handleSelect = useCallback((value: string) => {
    store.setKey("history", [
      ...store.get().history,
      { question: value, answer: "" },
    ]);
    store.setKey("prompt", "");
  }, []);
  return (
    <CommandItem disabled={loading} {...props} onSelect={handleSelect}>
      {children}
    </CommandItem>
  );
};

const SousChefResultData = () => {
  const answer = useCurrentAnswer();
  return <>{answer}</>;
};

export const SousChefOutput = () => {
  const answer = useCurrentAnswer();
  const question = useCurrentQuestion();
  const loading = useLoading();
  const [feedbackComplete, setFeedbackComplete] = useState(false);

  const pathname = usePathname();
  useLayoutEffect(() => {
    store.setKey("history", []);
  }, [pathname]);

  useLayoutEffect(() => {
    setFeedbackComplete(false);
  }, [loading, setFeedbackComplete]);

  const handleFeedback = useCallback(() => {
    setFeedbackComplete(true);
  }, [setFeedbackComplete]);
  useEventHandler("FEEDBACK", handleFeedback);

  return (
    answer &&
    answer.length && (
      <>
        <CardContent className="flex flex-col gap-2 py-5">
          <Label className="opacity-70">Question</Label>
          <p>{question}</p>
          <Label className="opacity-70 mt-5">Answer</Label>
          <SousChefResultData />
          {question && !loading && (
            <>
              {feedbackComplete ? (
                <p className="text-muted-foreground text-xs flex flex-row gap-1 items-center justify-center mt-3">
                  Thank you for your feedback!
                </p>
              ) : (
                <div className="flex flex-col gap-1 mt-3">
                  <p className="text-muted-foreground text-xs flex flex-row gap-1 items-center justify-center">
                    <HelpCircle size={14} />
                    <span>Was this helpful?</span>
                  </p>
                  <div className="flex flex-row gap-2">
                    <Button
                      event={{
                        type: "FEEDBACK",
                        rating: 0,
                        question,
                        answer,
                      }}
                      variant="secondary"
                      className="flex flex-row gap-1 flex-1"
                    >
                      <span>No</span> <ThumbsDown />
                    </Button>
                    <Button
                      event={{
                        type: "FEEDBACK",
                        rating: 1,
                        question,
                        answer,
                      }}
                      variant="secondary"
                      className="flex flex-row gap-1 flex-1"
                    >
                      <span>Yes</span> <ThumbsUpIcon />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <Separator />
      </>
    )
  );
};

export const SousChefPromptCommandGroup = () => {
  const loading = useLoading();
  const search = useCommandState((state) => state.search);
  const dirty = useDirty();

  return !loading && dirty && search.length ? (
    <CommandGroup heading="Actions">
      <SousChefCommandItem value={search} className="flex flex-row gap-2">
        <Button size="icon" variant="secondary">
          <HelpCircle className="opacity-40" />
        </Button>
        <div className="flex flex-col gap-1 flex-1">
          {/* <span className="text-xs opacity-70">Ask</span> */}
          <h4 className="font-semibold flex-1">{search}</h4>
        </div>
        <Badge variant="secondary">Ask</Badge>
      </SousChefCommandItem>
      <CommandItemClearPrompt />
    </CommandGroup>
  ) : null;
};

export const SousChefCommandInput = (
  props: ComponentProps<typeof CommandInput>
) => {
  const loading = useLoading();
  const setPrompt = useCallback((value: string) => {
    store.setKey("prompt", value);
  }, []);
  const { inputRef } = useStore(store, { keys: ["inputRef"] });

  const handleClear = useCallback(() => {
    store.setKey("prompt", "");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);
  useEventHandler("CLEAR", handleClear);

  const prompt = usePrompt();

  return (
    <>
      <div className="px-5">
        <p className="text-xs text-muted-foreground">
          Ask questions about this recipe:
        </p>
      </div>
      <CommandInput
        ref={inputRef}
        value={prompt}
        onValueChange={setPrompt}
        postIcon={loading ? "spinner" : "send"}
        {...props}
      />
    </>
  );
};
