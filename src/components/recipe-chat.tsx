"use client";
import { RecipeConfigurator } from "@/components/recipe-configurator";
import RecipeIngredients from "@/components/recipe-ingredients";
import RecipeSuggestions from "@/components/recipe-suggestions";
import { Card } from "@/components/ui/card";
import { Command, CommandInput } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptContext } from "@/context/prompt";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { assert, getChatRecipeSlug } from "@/lib/utils";
import {
  AppClient,
  AppEvent,
  CreateRecipeInput,
  RecipeAttributes,
} from "@/types";
import { Message } from "ai";
import {
  KeyboardEventHandler,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { ActorRefFrom, assign, createMachine, fromPromise } from "xstate";
import { Button } from "./ui/button";

type Context = {
  name: string | undefined;
  chatId: string;
  messages: Record<string, Message>;
  promptInput: string | undefined;
  currentRecipe:
    | {
        name: string;
        description: string;
        slug: string;
      }
    | undefined;
  attributes: RecipeAttributes;
};

export const createRecipeChatMachine = ({
  slug,
  userId,
  chatId,
  sessionId,
  trpcClient,
}: {
  sessionId: string;
  userId?: string;
  chatId: string;
  slug?: string;
  trpcClient: AppClient;
}) => {
  const initial = "New"; //  | "Created" | "Archived";

  return createMachine(
    {
      id: "RecipeChat",
      initial,
      types: {
        events: {} as AppEvent,
        context: {} as Context,
      },
      on: {
        SET_INPUT: {
          actions: assign({
            promptInput: ({ event }) => event.value,
          }),
        },
      },
      context: {
        name: undefined,
        chatId,
        currentRecipe: undefined,
        promptInput: undefined,
        messages: {},
        attributes: {
          ingredients: {},
          techniques: {},
          cuisines: {},
          cookware: {},
        },
      },
      states: {
        New: {
          initial: "Untouched",
          onDone: "Created",
          states: {
            Untouched: {
              always: [{ target: "Touched", guard: "hasTouchedAttributes" }],
            },
            Touched: {
              always: [
                { target: "Untouched", guard: "hasNoTouchedAttributes" },
              ],
              on: {
                SUBMIT: "Submitted",
              },
            },
            Submitted: {
              on: {
                SELECT_RECIPE: {
                  target: "Selecting",
                },
              },
            },
            Selecting: {
              on: {
                SELECT_RECIPE: {
                  target: "Creating",
                  actions: assign({
                    currentRecipe: ({ context, event }) => ({
                      description: event.description,
                      name: event.name,
                      slug: getChatRecipeSlug(context.chatId, event.name),
                    }),
                  }),
                },
              },
            },
            Creating: {
              invoke: {
                input: ({ context }) => {
                  assert(
                    context.currentRecipe,
                    "expected currentRecipe to be set when creating"
                  );

                  return {
                    name: context.currentRecipe.name,
                    description: context.currentRecipe?.description,
                    chatId: context.chatId,
                    slug: getChatRecipeSlug(
                      context.chatId,
                      context.currentRecipe.name
                    ),
                    messages: [],
                  } satisfies CreateRecipeInput;
                },
                src: fromPromise(({ input }) =>
                  trpcClient.createRecipe.mutate(input)
                ),
                onDone: "Viewing",
                onError: "Error",
              },
            },
            Viewing: {},
            Error: {
              entry: console.error,
            },
          },
        },
        Created: {},
        Archived: {},
      },
    },
    {
      guards: {
        hasTouchedAttributes,
        hasNoTouchedAttributes,
      },
    }
  );
};

type RecipeChatMachine = ReturnType<typeof createRecipeChatMachine>;
export type RecipeChatActor = ActorRefFrom<RecipeChatMachine>;

const hasTouchedAttributes = (props: { context: Context }) => {
  if (props.context.promptInput && props.context.promptInput !== "") {
    return true;
  }

  // Check for any record with a value of true
  const hasTrueRecord = Object.values(props.context.attributes).some(
    (attribute) => {
      if (typeof attribute === "object") {
        return Object.values(attribute).some((value) => value === true);
      }
      return false; // If not an object, it doesn't match our criteria for now
    }
  );

  // Check for any attribute with a non-undefined value
  const hasNonUndefinedValue = Object.values(props.context.attributes).some(
    (attribute) => {
      return typeof attribute === "string";
    }
  );

  return hasTrueRecord || hasNonUndefinedValue;
};

// Helper function to check if attributes have not been touched
const hasNoTouchedAttributes = ({ context }: { context: Context }) => {
  return !hasTouchedAttributes({ context });
};

export const RecipeChatContext = createContext({} as RecipeChatActor);

export function RecipeChat() {
  return (
    <Card className={`flex flex-col bg-slate-50 max-h-full m-4`}>
      <div className="p-3 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2">
          <RecipePromptLabel />
          <RecipeConfigurator />
        </div>
        <div>
          <RecipeCommand />
        </div>
      </div>
    </Card>
  );
}

const RecipePromptLabel = () => {
  const actor = useContext(RecipeChatContext);
  useSelector(actor, (state) => state.matches(""));

  return (
    <Label htmlFor="prompt" className="leading-5 w-full">
      <span>
        Enter <strong>ingredients</strong>, recipe <strong>name</strong> or a{" "}
        <strong>description</strong>.
      </span>
    </Label>
  );
};

const RecipeCommand = () => {
  return (
    <Command shouldFilter={false}>
      <RecipeIngredients />
      <div className="flex flex-col gap-3">
        {/* <ChatScrollFollow /> */}
        <ChatInput />
        <ChatSubmit />
      </div>
      {/* <ScrollArea style={{ maxHeight: "50vh" }}>
        <RecipeSuggestions />
      </ScrollArea> */}
    </Command>
  );
};

const ChatSubmit = forwardRef((props, ref) => {
  const actor = useContext(RecipeChatContext);
  const send = useSend();
  const enabled = useSelector(actor, (s) => s.matches("New.Touched"));

  const handlePress = useCallback(() => {
    send({ type: "SUBMIT" });
  }, [actor]);

  return (
    <Button disabled={!enabled} onClick={handlePress}>
      Suggest Recipes
    </Button>
  );
});
ChatSubmit.displayName = Button.displayName;

/**
 * On iOS when user opens keyboard, it causes the scroll
 * window to jump to a place so the text box is invisible
 * This circumvents that by jumping to top scroll anytime
 * viewprt changes
 */
// const ChatScrollFollow = () => {
//   const { vh } = useViewport();

//   useEffect(() => {
//     // alert(vh);
//     window.scrollTo(0, 0);
//   }, [vh]);
//   return null;
// };

const ChatInput = forwardRef<HTMLInputElement>((props, ref) => {
  const prompt$ = useContext(PromptContext);
  const actor = useContext(RecipeChatContext);
  const input = useSelector(actor, (state) => state.context.promptInput);
  const send = useSend();

  // Use the vw and vh in your component logic
  // todo pull this up in to a global component
  // document.documentElement.style.setProperty("--vw", `${vw}px`);
  // document.documentElement.style.setProperty("--vh", `${vh}px`);

  const handleValueChange = useCallback(
    (value: string) => {
      send({ type: "SET_INPUT", value });
    },
    [send]
  );

  const handleFocus = useCallback(() => {
    send({ type: "FOCUS_PROMPT" });
  }, [send, ref]);

  const handleBlur = useCallback(() => {
    send({ type: "BLUR_PROMPT" });
  }, [send]);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const value = e.currentTarget.value;
      if (e.key === "Enter" && value && value !== "") {
        e.preventDefault();
        send({ type: "SUBMIT" });
      }
    },
    [prompt$, send]
  );

  return (
    <CommandInput
      ref={ref}
      name="prompt"
      value={input}
      onValueChange={handleValueChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="(e.g. leftover pizza, eggs and feta)"
    />
  );
});
ChatInput.displayName = CommandInput.displayName;
