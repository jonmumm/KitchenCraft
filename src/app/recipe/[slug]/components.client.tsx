"use client";

import { Badge } from "@/components/display/badge";
import MarkdownRenderer from "@/components/display/markdown";
import { Button } from "@/components/input/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemClearPrompt,
} from "@/components/input/command";
import { useCommandState } from "@/components/input/command.primitive";
import { useEventHandler } from "@/hooks/useEventHandler";
import useEventSource from "@/hooks/useEventSource";
import { assert } from "@/lib/utils";
import { AppEvent } from "@/types";
import { useStore } from "@nanostores/react";
import { PlusIcon, ShuffleIcon } from "lucide-react";
import { map } from "nanostores";
import { useRouter } from "next/navigation";

import {
  ComponentProps,
  ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type Actions = {
  remix: (prompt: string) => Promise<string>;
};

const RemixCommandContext = createContext(
  map({
    loading: false,
    submittedPrompt: undefined as string | undefined,
    prompt: "" as string,
  })
);

export const RemixCommand = forwardRef<
  HTMLDivElement,
  { slug: string } & ComponentPropsWithoutRef<typeof Command>
>(({ slug, ...props }, ref) => {
  const store = useContext(RemixCommandContext);
  const router = useRouter();

  const handler = useCallback(
    (event: AppEvent) => {
      assert(event.type === "MODIFY_RECIPE_FREE_TEXT", "expected event"); // todo make this infer automatically
      router.push(
        `/recipe/${slug}/remix?prompt=${encodeURIComponent(
          event.prompt
        )}&modification=free_text`
      );

      //   remix(event.prompt).then(noop);
    },
    [router, slug]
  );

  useEventHandler("MODIFY_RECIPE_FREE_TEXT", handler);

  return (
    <Command shouldFilter={false} {...props}>
      {props.children}
    </Command>
  );
});

RemixCommand.displayName = "RemixCommand";

export const RemixCommandGroup = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof CommandGroup>
>(({ ...props }, ref) => {
  const state = useCommandState((state) => state);
  const search = useCommandState((state) => state.search);
  //   const search = useCommandState((state) => state.search);

  return state.search !== "" ? (
    <CommandGroup ref={ref} {...props}>
      <CommandItem
        event={{
          type: "MODIFY_RECIPE_FREE_TEXT",
          prompt: search,
        }}
        value={search}
        className="flex flex-row gap-2"
      >
        <Button size="icon" variant="secondary">
          <ShuffleIcon className="opacity-50" />
        </Button>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <span className="italic text-xs opacity-70">Modify this recipe</span>
          <h6 className="w-full font-semibold">{search}</h6>
        </div>
        <Badge className="uppercase">Remix</Badge>
      </CommandItem>
      <CommandItemClearPrompt />
    </CommandGroup>
  ) : null;
});
RemixCommandGroup.displayName = "RemixCommandGroup";

export const RemixCommandInput = (
  props: ComponentProps<typeof CommandInput>
) => {
  const store = useContext(RemixCommandContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading } = useStore(store, { keys: ["loading"] });
  const { prompt } = useStore(store, { keys: ["prompt"] });
  const handleClear = useCallback(() => {
    store.setKey("prompt", "");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef, store]);
  const handleValueChange = useCallback(
    (value: string) => {
      store.setKey("prompt", value);
    },
    [store]
  );

  useEventHandler("CLEAR", handleClear);
  return (
    <>
      <div className="px-5">
        <p className="text-xs text-muted-foreground">
          Describe your modification to this recipe.
        </p>
      </div>
      <CommandInput
        ref={inputRef}
        value={prompt}
        onValueChange={handleValueChange}
        postIcon={loading ? "spinner" : "send"}
        {...props}
      />
    </>
  );
};

export const AddTagButton = () => {
  const handlePress = useCallback(() => {
    alert("add tag not yet implemented");
  }, []);

  return (
    <Badge variant="outline" onClick={handlePress}>
      <PlusIcon size={15} />
    </Badge>
  );
};

export const TipsAndTricksContent = ({ slug }: { slug: string }) => {
  const [text, setText] = useState("");
  useEventSource(`/api/recipe/${slug}/tips-and-tricks`, {
    onProgress(charArray, currentToken) {
      setText(charArray);
    },
  });

  return <MarkdownRenderer markdownText={text} />;
};
