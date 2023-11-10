"use client";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useCommandState } from "cmdk";
import { HelpCircle, SendHorizontalIcon } from "lucide-react";
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
import { useData, useDirty, useLoading, usePrompt } from "./hooks";
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
    return listenKeys(store, ["submittedPrompt"], (state) => {
      // When we submit, if we we have a prompt and arent already loading
      // ...start loading
      if (state.submittedPrompt && !state.loading) {
        store.setKey("loading", true);
        const source = getSousChefEventSource(slug, state.submittedPrompt);
        const chunks: string[] = [];
        let resultId: string | null = null;
        source.onmessage = (event) => {
          if (!resultId) {
            resultId = event.data;
            return;
          }

          const chunk = z.string().parse(JSON.parse(event.data));
          chunks.push(chunk);
          store.setKey("data", chunks.join(""));
        };

        source.onerror = () => {
          // ends with error when server closes writer
          store.setKey("loading", false);
          if (source.readyState !== source.CLOSED) {
            source.close();
          }
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
    store.setKey("submittedPrompt", value);
  }, []);
  return (
    <CommandItem disabled={loading} {...props} onSelect={handleSelect}>
      {children}
    </CommandItem>
  );
};

export const SousChefSetResult = ({ result }: { result: string }) => {
  useEffect(() => {
    store.setKey("data", result);
  }, [result]);

  return null;
};

const SousChefResultData = () => {
  const data = useData();
  return <>{data}</>;
};

export const SousChefOutput = () => {
  const data = useData();
  return (
    data &&
    data.length && (
      <CardContent>
        <SousChefResultData />
      </CardContent>
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
          <HelpCircle />
        </Button>
        <div className="flex flex-col gap-1 flex-1">
          <h4 className="font-semibold">{search}</h4>
          <span className="text-xs italic uppercase">Ask</span>
        </div>
        <SendHorizontalIcon />
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
  const prompt = usePrompt();

  return (
    <>
      <div className="px-5">
        <p className="text-xs text-muted-foreground">
          Ask questions about this recipe:
        </p>
      </div>
      <CommandInput
        value={prompt}
        onValueChange={setPrompt}
        disabled={loading}
        {...props}
      />
    </>
  );
};
