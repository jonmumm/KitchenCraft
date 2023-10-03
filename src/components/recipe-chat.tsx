"use client";
import RecipeIngredients from "@/components/recipe-ingredients";
import { Card } from "@/components/ui/card";
import { Command, CommandInput } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
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
import { Settings2Icon } from "lucide-react";
import {
  KeyboardEventHandler,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
} from "react";
import { ActorRefFrom, assign, createMachine, fromPromise } from "xstate";
import { RecipeConfigurator } from "./recipe-configurator";
import { Button } from "./ui/button";

type Context = {
  name: string | undefined;
  chatId: string;
  messages: Record<string, Message>;
  promptInput: string;
  currentQuery: string | undefined;
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
  const initialStatus = !slug ? "New" : "Viewing";

  return createMachine(
    {
      id: "RecipeChat",
      types: {
        events: {} as AppEvent,
        context: {} as Context,
      },
      type: "parallel",
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
        promptInput: "",
        currentQuery: undefined,
        messages: {},
        attributes: {
          ingredients: {},
          techniques: {},
          cuisines: {},
          cookware: {},
        },
      },
      states: {
        Focus: {
          initial: "None",
          states: {
            None: {
              on: {
                FOCUS_PROMPT: {
                  target: "Input",
                },
              },
            },
            Input: {
              on: {
                BLUR_PROMPT: {
                  target: "None",
                },
              },
            },
          },
        },
        Configurator: {
          initial: "Closed",
          states: {
            Open: {
              on: {
                TOGGLE_CONFIGURATOR: "Closed",
              },
            },
            Closed: {
              on: {
                TOGGLE_CONFIGURATOR: "Open",
              },
            },
          },
        },
        Status: {
          initial: initialStatus,
          states: {
            New: {
              initial: "Untouched",
              onDone: "Viewing",
              states: {
                Untouched: {
                  always: [
                    { target: "Touched", guard: "hasTouchedAttributes" },
                  ],
                },
                Touched: {
                  always: [
                    { target: "Untouched", guard: "hasNoTouchedAttributes" },
                  ],
                  on: {
                    SUBMIT: {
                      target: "Selecting",
                      actions: assign({
                        currentQuery: ({ context }) => context.promptInput,
                        promptInput: ({ context }) => "",
                      }),
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
                    onDone: "Complete",
                    onError: "Error",
                  },
                },
                Error: {},
                Complete: {
                  type: "final",
                },
              },
            },
            Viewing: {},
          },
        },
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
  const actor = useContext(RecipeChatContext);
  const isConfiguratorOpen = useSelector(actor, (state) =>
    state.matches("Configurator.Open")
  );

  return (
    <div className="flex flex-col gap-4 max-h-full">
      {isConfiguratorOpen && (
        <Card className={`flex flex-col bg-slate-50 max-h-full mx-4`}>
          <RecipeConfigurator />
        </Card>
      )}
      <Card className={`flex flex-col bg-slate-50 max-h-full m-4`}>
        <div className="p-3 flex flex-col gap-4">
          <div className="flex flex-row items-center gap-2">
            <RecipePromptLabel />
            <ConfiguratorToggle />
          </div>
          <div>
            <RecipeCommand />
          </div>
        </div>
      </Card>
    </div>
  );
}

const ConfiguratorToggle = () => {
  const actor = useContext(RecipeChatContext);
  const open = useSelector(actor, (state) =>
    state.matches("Configurator.Open")
  );
  const send = useSend();

  const handlePressToggleConfigurator = useCallback(() => {
    send({ type: "TOGGLE_CONFIGURATOR" });
  }, [send]);

  return (
    <Button
      variant={open ? "default" : "outline"}
      className="w-16"
      onClick={handlePressToggleConfigurator}
    >
      <Settings2Icon className={!open ? "transform rotate-90" : ""} />
    </Button>
  );
};

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
        <ChatInput />
        <ChatSubmit />
      </div>
    </Command>
  );
};

const ChatSubmit = forwardRef((props, ref) => {
  const actor = useContext(RecipeChatContext);
  const send = useSend();
  const enabled = useSelector(actor, (s) => s.matches("Status.New.Touched"));

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

const ChatInput = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prompt$ = useContext(PromptContext);
  const actor = useContext(RecipeChatContext);
  const value = useSelector(actor, (state) => state.context.promptInput);
  const send = useSend();

  const handleValueChange = useCallback(
    (value: string) => {
      send({ type: "SET_INPUT", value });
    },
    [send]
  );

  const handleFocus = useCallback(() => {
    send({ type: "FOCUS_PROMPT" });

    // hack to update scroll after layout change
    // to fix safari keyboard issue
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 100);
  }, [send]);

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
      name="prompt"
      value={value}
      onValueChange={handleValueChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="(e.g. leftover pizza, eggs and feta)"
    />
  );
};
ChatInput.displayName = CommandInput.displayName;
