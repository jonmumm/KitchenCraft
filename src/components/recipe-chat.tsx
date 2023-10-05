"use client";
import RecipeIngredients from "@/components/recipe-ingredients";
import { Card } from "@/components/ui/card";
import { Command, CommandInput } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { PromptContext } from "@/context/prompt";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { assertType } from "@/lib/utils";
import {
  AppClient,
  AppEvent,
  CreateRecipeInput,
  Message,
  RecipeAttributes,
  RecipeChatInput,
} from "@/types";
import { useChat } from "ai/react";
import { Settings2Icon, XIcon } from "lucide-react";
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
import RecipeSuggestions from "./recipe-suggestions";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type Context = {
  name: string | undefined;
  description: string | undefined;
  slug: string | undefined;
  chatId: string;
  promptInput: string;
  currentQuery: string | undefined;
  recipeMessages: Message[];
  attributes: RecipeAttributes;
};

export const createRecipeChatMachine = ({
  initialStatus,
  trpcClient,
}: {
  initialStatus: "New" | "Viewing";
  trpcClient: AppClient;
}) => {
  const createRecipe = fromPromise(
    async ({ input }: { input: CreateRecipeInput }) =>
      trpcClient.createRecipe.mutate(input)
  );

  // const createMessage = fromPromise(
  //   async ({ input }: { input: CreateMessageInput }) =>
  //     trpcClient.createMessage.mutate(input)
  // );

  return createMachine(
    {
      id: "RecipeChat",
      types: {
        input: {} as RecipeChatInput,
        events: {} as AppEvent,
        context: {} as Context,
        actors: {} as {
          src: "createRecipe";
          logic: typeof createRecipe;
        },
      },
      type: "parallel",
      on: {
        SET_INPUT: {
          actions: assign({
            promptInput: ({ event }) => event.value,
          }),
        },
      },
      context: ({
        input: { name, chatId, slug, description, recipeMessages },
      }) => ({
        name,
        description,
        slug,
        chatId,
        recipeMessages,

        // todo pull these from search state and add to input
        promptInput: "",
        currentQuery: undefined,
        attributes: {
          ingredients: {},
          techniques: {},
          cuisines: {},
          cookware: {},
        },
      }),
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
            Input: {},
          },
        },
        Configurator: {
          initial: "Closed",
          states: {
            Open: {
              on: {
                TOGGLE_CONFIGURATOR: "Closed",
                CLOSE_CONFIGURATOR: "Closed",
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
                      target: "Suggesting",
                      actions: assign({
                        promptInput: () => "",
                      }),
                    },
                  },
                },
                Suggesting: {
                  on: {
                    SELECT_RECIPE: {
                      target: "CreatingRecipe",
                      actions: assign({
                        name: ({ event }) => event.name,
                        description: ({ event }) => event.description,
                      }),
                    },
                  },
                },
                CreatingRecipe: {
                  invoke: {
                    input: ({ context, event }) => {
                      assertType(event, "SELECT_RECIPE");
                      const { description, name } = event;
                      return {
                        chatId: context.chatId,
                        description,
                        name,
                      };
                    },
                    src: "createRecipe",
                    onDone: {
                      target: "Created",
                      actions: assign({
                        slug: ({ event }) => event.output.recipe.slug,
                      }),
                    },
                    onError: "Error",
                  },
                },
                Created: {
                  type: "final",
                },
                Error: {
                  entry: console.error,
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
      actors: {
        createRecipe,
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
  const isNew = useSelector(actor, (state) => {
    return state.matches("Status.New");
  });
  const isCreating = useSelector(actor, (state) => {
    return state.matches("Status.New.CreatingRecipe");
  });
  const isConfiguratorOpen = useSelector(actor, (state) =>
    state.matches("Configurator.Open")
  );
  const send = useSend();
  const handlePressClose = useCallback(() => {
    send({ type: "CLOSE_CONFIGURATOR" });
  }, [send]);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {isConfiguratorOpen && (
        <div className="flex flex-col gap-2">
          <Button onClick={handlePressClose} className="w-1/2 mx-auto">
            <XIcon />
            Close
          </Button>
          <Card className={`flex flex-col bg-slate-50 mx-4`}>
            <RecipeConfigurator />
          </Card>
        </div>
      )}
      {isNew && (
        <Card className={`flex flex-col bg-slate-50 m-4`}>
          <div className="p-3 flex flex-col gap-4">
            {!isCreating ? (
              <>
                <div className="flex flex-row items-center gap-2">
                  <RecipePromptLabel />
                  {/* <ConfiguratorToggle /> */}
                </div>
                <div>
                  <RecipeCommand />
                </div>
              </>
            ) : (
              <RecipeCreating />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

const RecipeCreating = () => {
  const actor = useContext(RecipeChatContext);
  const name = useSelector(actor, (state) => state.context.name);
  return (
    <div className="flex justify-center">
      <Badge variant="outline" className="p-4">
        🧪 Crafting {name}
      </Badge>
    </div>
  );
};

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
        Enter <strong>ingredients</strong>, a dish <strong>name</strong> or{" "}
        <strong>description</strong>.
      </span>
    </Label>
  );
};

const RecipeCommand = () => {
  const actor = useContext(RecipeChatContext);
  const isSuggesting = useSelector(actor, (state) =>
    state.matches("Status.New.Suggesting")
  );
  return (
    <Command shouldFilter={false}>
      <RecipeIngredients />
      <div className="flex flex-col gap-3">
        <ChatInput />
        <ChatSubmit />
      </div>
      {isSuggesting && <RecipeSuggestions />}
    </Command>
  );
};

const ChatSubmit = forwardRef((props, ref) => {
  const actor = useContext(RecipeChatContext);
  const send = useSend();
  const enabled = useSelector(actor, (s) => s.matches("Status.New.Touched"));
  const chatId = useSelector(actor, (state) => state.context.chatId);
  const { append } = useChat({
    id: "suggestions",
    api: `/api/chat/${chatId}/suggestions`,
  });

  const handlePress = useCallback(() => {
    send({ type: "SUBMIT" });
    append({
      role: "user",
      content: actor.getSnapshot().context.promptInput,
    });
  }, [actor, append]);

  return (
    <Button disabled={!enabled} onClick={handlePress}>
      Craft Recipes
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
  const actor = useContext(RecipeChatContext);
  const chatId = useSelector(actor, (state) => state.context.chatId);
  const { append } = useChat({
    id: "suggestions",
    api: `/api/chat/${chatId}/suggestions`,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prompt$ = useContext(PromptContext);
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
        append({
          role: "user",
          content: value,
        });
      }
    },
    [send, append, inputRef]
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
