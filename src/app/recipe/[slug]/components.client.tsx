"use client";

import { Badge } from "@/components/display/badge";
import { Button } from "@/components/input/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/input/command";
import { useEventHandler } from "@/hooks/useEventHandler";
import { assert, noop } from "@/lib/utils";
import { AppEvent } from "@/types";
import { useStore } from "@nanostores/react";
import { useCommandState } from "cmdk";
import { ShuffleIcon } from "lucide-react";
import { map } from "nanostores";
import { useRouter } from "next/navigation";

import {
  ComponentProps,
  ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  useCallback,
  useContext,
} from "react";

type Actions = {
  remix: (prompt: string) => Promise<string>;
};

const RemixCommandContext = createContext(
  map({
    loading: false,
    submittedPrompt: undefined as string | undefined,
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
    </CommandGroup>
  ) : null;
});
RemixCommandGroup.displayName = "RemixCommandGroup";

export const RemixCommandInput = (
  props: ComponentProps<typeof CommandInput>
) => {
  const store = useContext(RemixCommandContext);
  const { loading } = useStore(store, { keys: ["loading"] });

  return (
    <>
      <div className="px-5">
        <p className="text-xs text-muted-foreground">
          Describe your modification to this recipe.
        </p>
      </div>
      <CommandInput postIcon={loading ? "spinner" : "send"} {...props} />
    </>
  );
};
