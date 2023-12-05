"use client";

import { Badge } from "@/components/display/badge";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { EventButton } from "@/components/event-button";
import { Button } from "@/components/input/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemClearPrompt,
} from "@/components/input/command";
import { Sheet, SheetContent, SheetOverlay } from "@/components/layout/sheet";
import ClientOnly from "@/components/util/client-only";
import { useEventHandler } from "@/hooks/useEventHandler";
import { assert } from "@/lib/utils";
import { AppEvent, RemixEvent } from "@/types";
import { useStore } from "@nanostores/react";
import { useCommandState } from "cmdk";
import {
  ArrowLeftRightIcon,
  MicrowaveIcon,
  NutOffIcon,
  ScaleIcon,
  ShuffleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, Suspense } from "react";

import { useSend } from "@/hooks/useSend";
import {
  ComponentProps,
  ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useContext,
  useRef,
} from "react";
import { RemixContext } from "./context";

export const Remix = () => {
  const store = useContext(RemixContext);

  const { open } = useStore(store, { keys: ["open"] });

  const handleClose = useCallback(
    (event: RemixEvent) => {
      store.setKey("open", false);
    },
    [store]
  );
  useEventHandler("CLOSE", handleClose);

  const handleRemix = useCallback(
    (event: RemixEvent) => {
      console.log("OPEN!");
      store.setKey("slug", event.slug);
      store.setKey("open", true);
    },
    [store]
  );
  useEventHandler("REMIX", handleRemix);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      store.setKey("open", value);
    },
    [store]
  );
  console.log({ open });

  return (
    <ClientOnly>
      <Sheet open={open}>
        <SheetOverlay />
        <RemixSheetContent>
          <div className="px-5">
            <div className="flex flex-row justify-between gap-1 items-center py-4">
              <h3 className="uppercase text-xs font-bold text-accent-foreground">
                Remix
              </h3>
              <ShuffleIcon />
            </div>
          </div>
          <RemixCommand>
            <RemixCommandInput />
            <RemixCommandGroup />
          </RemixCommand>
          <Separator className="mb-4" />
          <div className="mb-4 flex flex-col gap-2">
            <Suspense fallback={<Skeleton className="w-full h-20" />}>
              <div className="grid grid-cols-2 px-3 gap-2">
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{
                    type: "MODIFY_RECIPE_INGREDIENTS",
                  }}
                >
                  <ArrowLeftRightIcon />
                  <h5>Substitute</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Add or replace ingredients.
                  </p>
                </EventButton>
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{
                    type: "MODIFY_RECIPE_DIETARY",
                  }}
                >
                  <NutOffIcon />
                  <h5>Dietary</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Modify recipe for specific diets.
                  </p>
                </EventButton>
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{
                    type: "MODIFY_RECIPE_SCALE",
                  }}
                >
                  <ScaleIcon />
                  <h5>Scale</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Adjust recipe for more/fewer servings.
                  </p>
                </EventButton>
                <EventButton
                  variant="outline"
                  className="w-full h-auto flex flex-col gap-1 items-center"
                  event={{ type: "MODIFY_RECIPE_EQUIPMENT" }}
                >
                  <MicrowaveIcon />
                  <h5>Equipment</h5>
                  <p className="text-xs font-medium text-muted-foreground">
                    Adapt recipe for different tools.
                  </p>
                </EventButton>
              </div>
            </Suspense>
          </div>
        </RemixSheetContent>
      </Sheet>
    </ClientOnly>
  );
};

export const RemixSheetContent = ({ children }: { children: ReactNode }) => {
  const send = useSend();
  const handlePointerDownOutside = useCallback(() => {
    send({ type: "CLOSE" });
  }, [send]);

  return (
    <SheetContent
      side={"bottom"}
      onPointerDownOutside={handlePointerDownOutside}
    >
      {children}
    </SheetContent>
  );
};

export const RemixCommand = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Command>
>(({ ...props }, ref) => {
  const store = useContext(RemixContext);
  const { slug } = useStore(store, { keys: ["slug"] });

  const router = useRouter();

  const handler = useCallback(
    (event: AppEvent) => {
      assert(event.type === "MODIFY_RECIPE_FREE_TEXT", "expected event"); // todo make this infer automatically
      router.push(
        `/recipe/${slug}/remix?prompt=${encodeURIComponent(
          event.prompt
        )}&modification=free_text`
      );
      store.setKey("open", false);

      //   remix(event.prompt).then(noop);
    },
    [router, slug, store]
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
  const store = useContext(RemixContext);
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
