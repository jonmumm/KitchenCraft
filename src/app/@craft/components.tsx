"use client";

import scaleList from "@/data/serving-scalings.json";
import Image from "next/image";
import { z } from "zod";

import ClientOnly from "@/components/client-only";
import ScrollLockComponent from "@/components/scroll-lock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { FloatingFooter } from "@/components/ui/floating-footer";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import useDebounce from "@/hooks/useDebounce";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { useStore } from "@nanostores/react";
import {
  ArrowLeftRightIcon,
  AxeIcon,
  ChevronRightIcon,
  CommandIcon,
  LightbulbIcon,
  MicrowaveIcon,
  NutOffIcon,
  PlusSquareIcon,
  ScaleIcon,
  XIcon,
  XSquareIcon,
  ZapIcon,
} from "lucide-react";
import { atom } from "nanostores";
import { parseAsString, useQueryState } from "next-usequerystate";
import { usePathname, useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ingredientsParser, tagsParser } from "../parsers";
import {
  MAX_NUM_DESCRIPTION_TOKENS,
  MAX_NUM_NAME_TOKENS,
  NUM_DESCRIPTION_PLACHOLDERS,
  NUM_DIETARY_ALTERNATIVES,
  NUM_NAME_PLACHOLDERS,
  NUM_RECIPE_EQUIPMENT_ADAPTATIONS,
  NUM_RECIPE_SUBSTITUTIONS,
  NUM_RECIPE_SUGGESTIONS,
} from "./constants";
import { CraftContext } from "./context";
import {
  useIngredients,
  useIsMacDesktop,
  useKeyboardToggle,
  usePrompt,
  useTags,
} from "./hooks";
import { createCraftMachine } from "./machine";
import {
  selectIsEmpty,
  selectIsInputting,
  selectIsModifying,
  selectIsModifyingDietary,
  selectIsModifyingEquipment,
  selectIsModifyingIngredients,
  selectIsModifyingScale,
  selectIsNew,
  selectIsOpen,
  selectLockScroll,
  selectPromptEmpty,
  selectShowOverlay,
} from "./selectors";

export default function CraftCommand({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const slug = useMemo(() => pathname.split("/").pop(), [pathname]);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  const actor = useActor(
    "craft",
    createCraftMachine(searchParams, router, scrollViewRef, slug)
  );

  const isOpen = useSelector(actor, selectIsOpen);
  const showOverlay = useSelector(actor, selectShowOverlay);
  const lockScroll = useSelector(actor, selectLockScroll);

  useKeyboardToggle();

  return (
    <CraftContext.Provider value={actor}>
      <ClientOnly>
        <FloatingFooter open={isOpen} overlay={showOverlay} showBack={true}>
          <Command shouldFilter={false} style={{ maxHeight: "85vh" }}>
            <CraftHeader />
            <ScrollLockComponent ref={scrollViewRef} active={lockScroll}>
              <SuggestionsGroup />
              <NewRecipeActionsGroup />

              <SubstitutionsGroup />
              <DietaryAlternativesGroup />
              <ScaleActionsGroup />
              <EquipmentAdaptationsGroup />
              {/* <IngredientsGroup />
              <TagsGroup /> */}
            </ScrollLockComponent>
            <Separator />
            <CraftInput />
            <AddedIngredientsSection />
            <AddedTagsSection />
          </Command>
        </FloatingFooter>
      </ClientOnly>
    </CraftContext.Provider>
  );
}

const CraftInput = () => {
  const [prompt] = useQueryState("prompt", parseAsString);
  const send = useSend();
  const handleInputBlur = useCallback(() => {
    send({ type: "BLUR_PROMPT" });
  }, [send]);

  const handleInputFocus = useCallback(() => {
    send({ type: "FOCUS_PROMPT" });
  }, [send]);

  const handleInputChange = useCallback(
    (value: string) => {
      send({ type: "SET_INPUT", value });
    },
    [send]
  );

  return (
    <CommandInput
      value={prompt || ""}
      onValueChange={handleInputChange}
      autoFocus
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      icon={"prompt"}
    />
  );
};

const PromptText = () => {
  const prompt = usePrompt();
  return <>{prompt}</>;
};

const SuggestRecipesAction = () => {
  const tags = useTags();
  const ingredients = useIngredients();
  const send = useSend();
  const handleSelect = useCallback(() => {
    send({ type: "SUGGEST_RECIPES" });
  }, [send]);

  return (
    <CommandItem variant="card" onSelect={handleSelect}>
      <div className="w-full flex flex-row gap-3 items-center py-2">
        <Button size="icon" variant="secondary">
          <LightbulbIcon />
        </Button>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <span className="italic text-xs opacity-70">
            Generate <span className="font-semibold">6</span> recipe ideas
          </span>
          <h6 className="w-full font-semibold">
            <PromptText />
          </h6>
          <div className="flex flex-row gap-1 flex-wrap">
            {tags &&
              tags.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            {ingredients &&
              ingredients.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    </CommandItem>
  );
};

const InstantRecipeAction = () => {
  const send = useSend();
  const tags = useTags();
  const ingredients = useIngredients();
  const handleSelect = useCallback(() => {
    send({ type: "INSTANT_RECIPE" });
  }, [send]);

  return (
    <CommandItem variant="card" onSelect={handleSelect}>
      <div className="w-full flex flex-row gap-3 items-center py-2">
        <Button size="icon" variant="secondary">
          <ZapIcon />
        </Button>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <span className="italic text-xs opacity-70">
            Instantly create a recipe
          </span>
          <h6 className="w-full font-semibold">
            <PromptText />
          </h6>
          <div className="flex flex-row gap-1 flex-wrap">
            {tags &&
              tags.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            {ingredients &&
              ingredients.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    </CommandItem>
  );
};

const IngredientsGroup = ({}: {}) => {
  const [ingredients$] = useState(atom<string[]>([]));
  const actor = useContext(CraftContext);
  const isNew = useSelector(actor, selectIsNew);
  const isInputting = useSelector(actor, selectIsInputting);

  if (!isNew || !isInputting) {
    return null;
  }

  const IngredientsFetcher = () => {
    const prompt = usePrompt();
    const debouncedPrompt = useDebounce(prompt, 500);

    useEffect(() => {
      if (debouncedPrompt) {
        const abortCtrl = new AbortController();
        const signal = abortCtrl.signal;

        fetch(
          `/api/ingredients?prompt=${encodeURIComponent(debouncedPrompt)}`,
          { signal }
        )
          .then((resp) => {
            if (!signal.aborted) {
              return resp.json();
            }
          })
          .then((data) => {
            if (data && !signal.aborted) {
              const parsedData = z.array(z.string()).parse(data);
              ingredients$.set(parsedData);
            }
          })
          .catch((error) => {
            if (error.name !== "AbortError") {
              console.error("Fetch error:", error);
            }
          });

        return () => abortCtrl.abort();
      } else {
        ingredients$.set([]);
      }
    }, [debouncedPrompt]);

    // You may want to render something based on the ingredients state
    // return <>{/* Render something with ingredients */}</>;
    return null; // If nothing needs to be rendered
  };

  const IngredientsList = () => {
    const send = useSend();
    const actor = useContext(CraftContext);
    const promptEmpty = useSelector(actor, selectPromptEmpty);
    const ingredients = useStore(ingredients$);
    const handleSelect = useCallback(
      (item: string) => {
        return () => {
          send({ type: "ADD_INGREDIENT", ingredient: item });
          ingredients$.set([]);
        };
      },
      [send]
    );

    const MainItem = () => {
      const prompt = usePrompt();

      return prompt ? (
        <CommandItem onSelect={handleSelect(prompt)} className="flex flex-row">
          <span className="flex-1">
            <span className="italic">Add ingredient</span> &apos;
            <span className="font-bold">{prompt}</span>&apos;
          </span>
          <PlusSquareIcon className="opacity-50" />
        </CommandItem>
      ) : null;
    };

    return ingredients.length || !promptEmpty ? (
      <CommandGroup heading="Ingredients">
        {ingredients.map((item) => {
          const { prompt } = actor.getSnapshot().context;
          const promptLength = prompt?.length!;
          const matchIndex = item.toLowerCase().indexOf(prompt?.toLowerCase()!);

          const startToken = item.slice(0, matchIndex);
          const midToken = item.slice(matchIndex, matchIndex + promptLength);
          const endToken = item.slice(matchIndex + promptLength);

          return (
            <CommandItem
              key={item}
              onSelect={handleSelect(item)}
              className="flex flex-row"
            >
              <span className="flex-1">
                <span>{startToken}</span>
                <span className="font-bold">{midToken}</span>
                <span>{endToken}</span>
              </span>
              <PlusSquareIcon className="opacity-50" />
            </CommandItem>
          );
        })}
        <MainItem />
      </CommandGroup>
    ) : null;
  };

  return (
    <>
      <IngredientsFetcher />
      <IngredientsList />
    </>
  );
};

const CraftHeader = () => {
  const actor = useContext(CraftContext);
  const isNewRecipe = useSelector(actor, selectIsNew);
  const isModifyingRecipe = useSelector(actor, selectIsModifying);
  const isEmpty = useSelector(actor, selectIsEmpty);

  return (
    isEmpty && (
      <CardHeader className="flex flex-row gap-2 items-start justify-between">
        {isNewRecipe && <NewRecipeHeader />}
        {isModifyingRecipe && <ModifyRecipeHeader />}

        <KeyboardShortcutBadge />
      </CardHeader>
    )
  );
};

const KeyboardShortcutBadge = () => {
  const show = useIsMacDesktop();
  // todo ctrl-k for windows
  return (
    show && (
      <Badge variant="secondary">
        <CommandIcon size={14} />
        <span style={{ fontSize: "14px" }}>K</span>
      </Badge>
    )
  );
};

const NewRecipeHeader = () => {
  const actor = useContext(CraftContext);
  const isInputting = useSelector(
    actor,
    (state) =>
      state.matches("Mode.New.Inputting") ||
      state.matches("Mode.Modify.Inputting")
  );
  const isSuggesting = useSelector(actor, (state) =>
    state.matches("Mode.New.Suggestions")
  );

  return (
    <>
      {isInputting && <NewRecipeInputtingHeader />}
      {isSuggesting && <NewRecipeSuggestingHeader />}
    </>
  );
};

const ModifyRecipeHeader = () => {
  const actor = useContext(CraftContext);
  const isModifyingEquipment = useSelector(actor, selectIsModifyingEquipment);
  const isModifyingScale = useSelector(actor, selectIsModifyingScale);
  const isModifyingIngredients = useSelector(
    actor,
    selectIsModifyingIngredients
  );
  const isModifyingDietary = useSelector(actor, selectIsModifyingDietary);

  const ModifyingEquipment = () => (
    <>
      <CardTitle>Equipment</CardTitle>
      <CardDescription>Adapt recipe for different tools.</CardDescription>
    </>
  );

  const ModifyingScale = () => (
    <>
      <CardTitle>Scale</CardTitle>
      <CardDescription>Adjsut recipe for more/fewer servings.</CardDescription>
    </>
  );
  const ModifyingDietary = () => (
    <>
      <CardTitle>Dietary</CardTitle>
      <CardDescription>Modify recipe for specific diets.</CardDescription>
    </>
  );
  const ModifyingIngredients = () => (
    <>
      <CardTitle>Substitute</CardTitle>
      <CardDescription>Add or replace ingredients.</CardDescription>
    </>
  );

  return (
    <div className="flex flex-row gap-3 items-center">
      {isModifyingEquipment && <MicrowaveIcon />}
      {isModifyingScale && <ScaleIcon />}
      {isModifyingDietary && <NutOffIcon />}
      {isModifyingIngredients && <ArrowLeftRightIcon />}
      <div className="flex flex-col gap-1">
        {isModifyingEquipment && <ModifyingEquipment />}
        {isModifyingScale && <ModifyingScale />}
        {isModifyingDietary && <ModifyingDietary />}
        {isModifyingIngredients && <ModifyingIngredients />}
      </div>
    </div>
  );
};

const NewRecipeSuggestingHeader = () => {
  return (
    <div className="flex flex-row gap-3 items-center">
      <Button size="icon" variant="outline">
        🧪
      </Button>
      <div className="flex flex-col gap-1">
        <CardTitle>Conjuring 6 suggestions</CardTitle>
        <CardDescription className="font-semibold">
          Choose one to craft a full recipe.
        </CardDescription>
      </div>
    </div>
  );
};

const NewRecipeInputtingHeader = () => {
  return (
    <div className="flex flex-row gap-3 items-center">
      <Image
        className="w-12 aspect-square"
        src="/apple-touch-icon.png"
        alt="KitchenCraft Logo"
        width={44}
        height={44}
      />
      <div className="flex flex-col gap-1">
        <CardDescription>
          Enter ingredients, cooking techniques, descriptions.
        </CardDescription>
      </div>
    </div>
  );
};

const AddedIngredientsSection = () => {
  const [ingredients] = useQueryState("ingredients", ingredientsParser);

  return ingredients?.length ? (
    <div className="px-5 mb-3">
      <Label className="text-muted-foreground uppercase text-xs">
        Ingredients
      </Label>
      <AddedIngredientsList />
    </div>
  ) : null;
};

const AddedIngredientsList = () => {
  const send = useSend();
  const [ingredients] = useQueryState("ingredients", ingredientsParser);
  const actor = useContext(CraftContext);

  const handlePressItem = useCallback(
    (item: string) => {
      return () => {
        send({ type: "REMOVE_INGREDIENT", ingredient: item });
      };
    },
    [send]
  );

  return (
    <div className="flex flex-row gap-1 flex-wrap">
      {ingredients &&
        ingredients.map((item) => {
          return (
            <Badge
              onClick={handlePressItem(item)}
              key={item}
              variant="secondary"
              className="flex flex-row gap-1"
            >
              {item}
              <XIcon size={18} />
            </Badge>
          );
        })}
    </div>
  );
};

const TagsGroup = ({}: {}) => {
  const [suggestions$] = useState(atom<string[]>([]));
  const actor = useContext(CraftContext);
  const isInputting = useSelector(actor, selectIsInputting);
  const isNew = useSelector(actor, selectIsNew);

  if (!isNew || !isInputting) {
    return null;
  }

  const TagsFetcher: React.FC = () => {
    const prompt = usePrompt();
    const debouncedPrompt = useDebounce(prompt, 500); // Debounce prompt input

    useEffect(() => {
      if (debouncedPrompt) {
        const abortCtrl = new AbortController();
        const signal = abortCtrl.signal;

        fetch(`/api/tags?prompt=${encodeURIComponent(debouncedPrompt)}`, {
          signal,
        })
          .then((resp) => {
            if (!signal.aborted) {
              return resp.json();
            }
          })
          .then((data) => {
            if (data && !signal.aborted) {
              const parsedData = z.array(z.string()).parse(data);
              suggestions$.set(parsedData); // Assuming suggestions$ is your state management observable
            }
          })
          .catch((error) => {
            if (error.name !== "AbortError") {
              console.error("Fetch error:", error);
            }
          });

        // Cleanup function to cancel the request if the component unmounts or prompt changes
        return () => abortCtrl.abort();
      } else {
        suggestions$.set([]);
      }
    }, [debouncedPrompt]); // Only trigger effect when debouncedPrompt changes

    return null; // If nothing is being rendered, return null
  };

  const TagsList = () => {
    // const [tags, setTags] = useQueryState("tags", tagsParser);
    const actor = useContext(CraftContext);
    const promptEmpty = useSelector(actor, selectPromptEmpty);
    const send = useSend();

    const handleSelect = useCallback(
      (item: string) => {
        return () => {
          send({ type: "ADD_TAG", tag: item });
          suggestions$.set([]);
        };
      },
      [send]
    );
    const suggestions = useStore(suggestions$);

    const MainItem = () => {
      const prompt = usePrompt();

      return prompt ? (
        <CommandItem onSelect={handleSelect(prompt)} className="flex flex-row">
          <span className="flex-1">
            <span className="italic">Add tag</span> &apos;
            <span className="font-bold">{prompt}</span>&apos;
          </span>
          <PlusSquareIcon className="opacity-50" />
        </CommandItem>
      ) : null;
    };

    return suggestions.length || !promptEmpty ? (
      <CommandGroup heading="Tags">
        {suggestions.map((item) => {
          const { prompt } = actor.getSnapshot().context;
          const promptLength = prompt?.length!;
          const matchIndex = item.toLowerCase().indexOf(prompt?.toLowerCase()!);

          const startToken = item.slice(0, matchIndex);
          const midToken = item.slice(matchIndex, matchIndex + promptLength);
          const endToken = item.slice(matchIndex + promptLength);

          return (
            <CommandItem
              key={item}
              onSelect={handleSelect(item)}
              className="flex flex-row"
            >
              <span className="flex-1">
                <span>{startToken}</span>
                <span className="font-bold">{midToken}</span>
                <span>{endToken}</span>
              </span>
              <PlusSquareIcon className="opacity-50" />
            </CommandItem>
          );
        })}
        <MainItem />
      </CommandGroup>
    ) : null;
  };

  return (
    <>
      <TagsFetcher />
      <TagsList />
    </>
  );
};

const AddedTagsList = () => {
  const send = useSend();
  const [tags] = useQueryState("tags", tagsParser);

  const handlePressItem = useCallback(
    (tag: string) => {
      return () => {
        send({ type: "REMOVE_TAG", tag });
      };
    },
    [send]
  );

  return (
    <div className="flex flex-row gap-1 flex-wrap">
      {tags &&
        tags.map((item) => {
          return (
            <Badge
              onClick={handlePressItem(item)}
              key={item}
              variant="secondary"
              className="flex flex-row gap-1"
            >
              {item}
              <XIcon size={18} />
            </Badge>
          );
        })}
    </div>
  );
};

const AddedTagsSection = () => {
  const [tags] = useQueryState("tags", tagsParser);

  return tags?.length ? (
    <div className="px-5 mb-3">
      <Label className="text-muted-foreground uppercase text-xs">Tags</Label>
      <AddedTagsList />
    </div>
  ) : null;
};

const SuggestionsGroup = () => {
  const actor = useContext(CraftContext);
  const hasSuggestions = useSelector(
    actor,
    (state) =>
      state.matches("Mode.New.Suggestions") || state.context.suggestions
  );
  const [items] = useState(new Array(NUM_RECIPE_SUGGESTIONS).fill(0));

  return (
    hasSuggestions && (
      <CommandGroup heading="Ideas" className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          {items.map((_, index) => {
            return <RecipeSuggestionItem key={index} index={index} />;
          })}
          <ClearResultsItem />
        </div>
      </CommandGroup>
    )
  );
};

const SubstitutionsGroup = () => {
  const [items] = useState(new Array(NUM_RECIPE_SUBSTITUTIONS).fill(0));
  const actor = useContext(CraftContext);
  const hasContent = useSelector(actor, (state) =>
    state.matches("Mode.Modify.Substitute")
  );

  return (
    hasContent && (
      <CommandGroup heading="Ideas" className="flex flex-col gap-2">
        {items.map((_, index) => {
          return <RecipeSubstitutionsItem key={index} index={index} />;
        })}
        <ClearResultsItem />
      </CommandGroup>
    )
  );
};

const DietaryAlternativesGroup = () => {
  const [items] = useState(new Array(NUM_DIETARY_ALTERNATIVES).fill(0));
  const actor = useContext(CraftContext);
  const hasContent = useSelector(actor, (state) =>
    state.matches("Mode.Modify.Dietary")
  );

  return (
    hasContent && (
      <CommandGroup heading="Ideas" className="flex flex-col gap-2">
        {items.map((_, index) => {
          return <DietaryAlternativesItem key={index} index={index} />;
        })}
      </CommandGroup>
    )
  );
};

const DietaryAlternativesItem = ({ index }: { index: number }) => {
  const send = useSend();
  const handleSelectRecipe = useCallback(() => {
    send({
      type: "SELECT_RESULT",
      index,
    });
  }, [send, index]);

  const actor = useContext(CraftContext);
  const text = useSelector(actor, (state) => {
    const { dietaryAlternatives } = state.context;
    if (!dietaryAlternatives) {
      return undefined;
    }
    return dietaryAlternatives[index];
  });

  return (
    <CommandItem
      className="flex flex-row gap-2 flex-1"
      value={index.toString()}
      onSelect={text ? handleSelectRecipe : undefined}
    >
      <div className="flex flex-col gap-2 flex-1">
        {text ? <h3>{text}</h3> : <Skeleton className="w-full h-7" />}
      </div>
      <Button variant="ghost">
        <ChevronRightIcon />
      </Button>
    </CommandItem>
  );
};

const ClearResultsItem = () => {
  const actor = useContext(CraftContext);
  const canClear = useSelector(
    actor,
    (state) =>
      state.matches("Mode.New.Inputting") && state.context.suggestions?.length
  );
  const send = useSend();
  const handlePressClear = useCallback(() => {
    send({ type: "CLEAR" });
  }, [send]);

  return (
    canClear && (
      <CommandItem
        className="flex flex-row flex-1 items-center"
        onSelect={handlePressClear}
      >
        <Button size="icon" variant="outline">
          <XSquareIcon />
          Clear Results
        </Button>
      </CommandItem>
    )
  );
};

const RecipeSubstitutionsItem = ({ index }: { index: number }) => {
  const send = useSend();
  const handleSelectRecipe = useCallback(() => {
    send({
      type: "SELECT_RESULT",
      index,
    });
  }, [send, index]);

  const actor = useContext(CraftContext);
  const text = useSelector(actor, (state) => {
    const { substitutions } = state.context;
    if (!substitutions) {
      return undefined;
    }
    return substitutions[index];
  });

  return (
    <CommandItem
      className="flex flex-row gap-2 flex-1"
      value={index.toString()}
      onSelect={text ? handleSelectRecipe : undefined}
    >
      {/* <Button size="icon" variant="secondary">
        <ScrollTextIcon />
      </Button> */}
      <div className="flex flex-col gap-2 flex-1">
        {text ? <h5>{text}</h5> : <Skeleton className="w-full h-7" />}
      </div>
      <Button variant="ghost">
        <ChevronRightIcon />
      </Button>
    </CommandItem>
  );
};

const EquipmentAdaptationItem = ({ index }: { index: number }) => {
  const send = useSend();
  const handleSelectRecipe = useCallback(() => {
    send({
      type: "SELECT_RESULT",
      index,
    });
  }, [send, index]);

  const actor = useContext(CraftContext);
  const text = useSelector(actor, (state) => {
    const { equipmentAdaptations } = state.context;
    if (!equipmentAdaptations) {
      return undefined;
    }
    return equipmentAdaptations[index];
  });

  return (
    <CommandItem
      className="flex flex-row gap-2 flex-1"
      value={index.toString()}
      onSelect={text ? handleSelectRecipe : undefined}
    >
      <div className="flex flex-col gap-2 flex-1">
        {text ? <h3>{text}</h3> : <Skeleton className="w-full h-7" />}
      </div>
      <Button variant="ghost">
        <ChevronRightIcon />
      </Button>
    </CommandItem>
  );
};

const RecipeSuggestionItem = ({ index }: { index: number }) => {
  const send = useSend();
  const handleSelectRecipe = useCallback(() => {
    send({
      type: "SELECT_RESULT",
      index,
    });
    // send({
    //   type: "CLOSE",
    // });

    // setTimeout(() => {
    //   send({
    //     type: "CLOSE",
    //   });
    // }, 50);
  }, [send, index]);

  return (
    <>
      <CommandItem
        className="flex flex-row gap-2 flex-1"
        value={index.toString()}
        onSelect={handleSelectRecipe}
        variant="card"
      >
        <div className="flex flex-col gap-1">
          <Button className="w-14" size="icon" variant="secondary">
            <AxeIcon />
          </Button>
          <span className="opacity-50 text-xs text-center">Craft</span>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <h3 className="font-semibold flex flex-row gap-1 flex-wrap">
            <SuggestionsName index={index} />
          </h3>
          <div className="flex flex-row gap-1 flex-wrap">
            <SuggestionsDescription index={index} />
          </div>
        </div>
        <Button variant="ghost">
          <ChevronRightIcon />
        </Button>
      </CommandItem>
    </>
  );
};

const SuggestionsDescription = ({ index }: { index: number }) => {
  const [tokens] = useState(new Array(MAX_NUM_DESCRIPTION_TOKENS).fill(0));

  return tokens.map((_, tokenIndex) => {
    return (
      <Fragment key={tokenIndex}>
        <SuggestionDescriptionToken
          tokenIndex={tokenIndex}
          suggestionIndex={index}
        />{" "}
      </Fragment>
    );
  });
};

const SuggestionsName = ({ index }: { index: number }) => {
  const [tokens] = useState(new Array(MAX_NUM_NAME_TOKENS).fill(0));

  return tokens.map((_, tokenIndex) => {
    return (
      <Fragment key={tokenIndex}>
        <SuggestionNameToken tokenIndex={tokenIndex} suggestionIndex={index} />{" "}
      </Fragment>
    );
  });
};
const SuggestionNameToken = ({
  tokenIndex,
  suggestionIndex,
}: {
  suggestionIndex: number;
  tokenIndex: number;
}) => {
  const actor = useContext(CraftContext);
  const [tokenWidth] = useState(
    () => [12, 16, 20][Math.floor(Math.random() * 3)]
  );

  const token = useSelector(actor, (state) => {
    const { suggestions } = state.context;
    if (!suggestions) {
      return undefined;
    }

    const name = suggestions[suggestionIndex]?.name;
    const tokens = name?.split(" ") || [];
    const descriptionExists = !!suggestions[suggestionIndex]?.description;
    const nextTokenExists = tokens[tokenIndex + 1];
    const suggestionsLoading = state.matches("Mode.New.Suggestions.Loading");

    // We know this token is done loading if the next token exists or if there is a description
    // or if the whole thin gis done loading
    const isLoaded =
      nextTokenExists || descriptionExists || !suggestionsLoading;

    // console.log({ name, tokenIndex, isLoaded, predictionStillRunning });

    if (name && isLoaded) {
      const token = name.split(" ")[tokenIndex];
      if (token) {
        return token;
      } else if (isLoaded) {
        return null;
      }
    }
    return undefined;
  });

  return token ? (
    <>{token}</>
  ) : token === undefined && tokenIndex < NUM_NAME_PLACHOLDERS ? (
    <Skeleton className={`w-${tokenWidth} h-4`} />
  ) : null;
};

const SuggestionDescriptionToken = ({
  tokenIndex,
  suggestionIndex,
}: {
  suggestionIndex: number;
  tokenIndex: number;
}) => {
  const actor = useContext(CraftContext);
  const [tokenWidth] = useState(
    () => [12, 16, 20][Math.floor(Math.random() * 3)]
  );

  const token = useSelector(actor, (state) => {
    const { suggestions } = state.context;
    if (!suggestions) {
      return undefined;
    }

    const description = suggestions[suggestionIndex]?.description;
    const tokens = description?.split(" ") || [];
    const descriptionExists = !!suggestions[suggestionIndex]?.description;
    const nextTokenExists = tokens[tokenIndex + 1];
    const suggestionsLoading = state.matches("Mode.New.Suggestions.Loading");

    // We know this token is done loading if the next token exists or if there is a description
    // or if the whole thin gis done loading
    const isLoaded =
      nextTokenExists || descriptionExists || !suggestionsLoading;

    // console.log({ name, tokenIndex, isLoaded, predictionStillRunning });

    if (description && isLoaded) {
      const token = description.split(" ")[tokenIndex];
      if (token) {
        return token;
      } else if (isLoaded) {
        return null;
      }
    }
    return undefined;
  });

  return token ? (
    <>{token}</>
  ) : token === undefined && tokenIndex < NUM_DESCRIPTION_PLACHOLDERS ? (
    <Skeleton className={`w-${tokenWidth} h-4`} />
  ) : null;
};

const NewRecipeActionsGroup = () => {
  const actor = useContext(CraftContext);
  const active = useSelector(actor, selectIsNew);
  const inputReady = useSelector(
    actor,
    ({ context }) =>
      (context.prompt && context.prompt !== "") ||
      context.ingredients?.length ||
      context.tags?.length
  );

  if (!active || !inputReady) {
    return null;
  }

  return (
    <CommandGroup heading="Actions">
      <div className="flex flex-col gap-2">
        <SuggestRecipesAction />
        <InstantRecipeAction />
      </div>
      {/* <SuggestRecipesAction />
      <InstantRecipeAction /> */}
    </CommandGroup>
  );
};

const EquipmentAdaptationsGroup = () => {
  const [items] = useState(new Array(NUM_RECIPE_EQUIPMENT_ADAPTATIONS).fill(0));
  const actor = useContext(CraftContext);
  const active = useSelector(actor, (state) =>
    state.matches("Mode.Modify.Equipment")
  );
  const prompt = usePrompt();

  if (!active) {
    return null;
  }

  return (
    <CommandGroup heading="Actions">
      {prompt && prompt !== "" && (
        <CommandItem
          value={prompt}
          event={{ type: "SUBMIT_PROMPT", prompt }}
          className="flex flex-row gap-2"
        >
          <div className="flex-1 flex flex-col gap-1">
            <h5>{prompt}</h5>
            <span className="opacity-70">Scale</span>
          </div>
          <ChevronRightIcon />
        </CommandItem>
      )}
      {items.map((_, index) => {
        return <EquipmentAdaptationItem key={index} index={index} />;
      })}
    </CommandGroup>
  );
};

const ScaleActionsGroup = () => {
  const actor = useContext(CraftContext);
  const prompt = usePrompt();
  const active = useSelector(actor, selectIsModifyingScale);

  if (!active) {
    return null;
  }

  return (
    <CommandGroup heading="Ideas">
      {prompt && prompt !== "" && (
        <CommandItem
          value={prompt}
          event={{ type: "SUBMIT_PROMPT", prompt }}
          className="flex flex-row gap-2"
        >
          <div className="flex-1 flex flex-col gap-1">
            <h5>{prompt}</h5>
          </div>
          <ChevronRightIcon />
        </CommandItem>
      )}
      {scaleList.map((item) => {
        return (
          <CommandItem key={item} className="flex flex-row gap-2 flex-1">
            <div className="flex flex-col gap-2 flex-1">
              <h5>{item}</h5>
            </div>
            <Button variant="ghost">
              <ChevronRightIcon />
            </Button>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
};
