"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@nanostores/react";
import { useCommandState } from "cmdk";
import { HelpCircle } from "lucide-react";
import { listenKeys } from "nanostores";
import {
  ComponentProps,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { useCurrentAnswer, useDirty, useLoading, usePrompt } from "./hooks";
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

      // When we submit, if we we have a prompt and arent already loading
      // ...start loading
      if (history[index].question && !state.loading) {
        store.setKey("index", index + 1);
        store.setKey("loading", true);
        const source = getSousChefEventSource(slug, history[index].question);
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
          setTimeout(() => {
            store.get().inputRef.current?.focus();
          }, 50);
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
  return <CommandGroup {...props} />;
};

export const SousChefCommandItem = ({
  children,
  ...props
}: ComponentProps<typeof CommandItem>) => {
  const loading = useLoading();
  const handleSelect = useCallback((value: string) => {
    store.setKey("prompt", value);
    store.setKey("history", [
      ...store.get().history,
      { question: store.get().prompt!, answer: "" },
    ]);
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
  return (
    answer &&
    answer.length && (
      <>
        <CardContent className="flex flex-col gap-2 py-5">
          <Label>Answer</Label>
          <SousChefResultData />
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

  // const handleSubmit = useCallback(() => {
  //   store.setKey("submittedPrompt", store.get().prompt);
  // }, [store]);
  const prompt = usePrompt();
  // const ref = store.get().inputRef;

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
        disabled={loading}
        postIcon={!loading && prompt?.length ? "send" : undefined}
        {...props}
      />
    </>
  );
};
