"use client";

import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { assert } from "@/lib/utils";
import { RecipeViewerDataSchema } from "@/schema";
import { isAssistantMessage, isUserMessage } from "@/type-utils";
import { Message, RecipeViewerData } from "@/types";
import { useStore } from "@nanostores/react";
import { nanoid } from "ai";
import { useChat } from "ai/react";
import * as yaml from "js-yaml";
import {
  ArrowBigUpDashIcon,
  AxeIcon,
  CameraIcon,
  ChefHatIcon,
  ClockIcon,
  InfoIcon,
  PaperclipIcon,
  PlusSquareIcon,
  PrinterIcon,
  SaveIcon,
  ScrollIcon,
  ShareIcon,
  ShoppingBasketIcon,
  ShuffleIcon,
  TagIcon,
} from "lucide-react";
import { map } from "nanostores";
import Link from "next/link";
import {
  ChangeEventHandler,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RecipeChatContext } from "./recipe-chat";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";

const RecipeViewerContext = createContext(
  map<RecipeViewerData & { content: string | undefined }>()
);

export default function RecipeViewer() {
  const actor = useContext(RecipeChatContext);
  const recipe = useSelector(actor, (state) => state.context.recipe);
  assert(!!recipe, "expected recipe to exist");
  const initialMessages = useSelector(
    actor,
    (state) => state.context.recipeMessages
  );
  const assistantMessage = initialMessages.find(isAssistantMessage);

  const [store] = useState(() =>
    map({
      content: assistantMessage?.content,
    })
  );

  return (
    <RecipeViewerContext.Provider value={store}>
      <RecipeLoader
        name={recipe.name!}
        description={recipe.description!}
        slug={recipe.slug!}
        initialMessages={initialMessages}
      />
      <RecipeContentParser />
      <RecipeContent />
    </RecipeViewerContext.Provider>
  );
}

function RecipeContent() {
  const actor = useContext(RecipeChatContext);
  const send = useSend();
  const name = useSelector(actor, (state) => state.context.recipe.name);
  const description = useSelector(
    actor,
    (state) => state.context.recipe.description
  );
  const handlePressPhoto = useCallback(() => {
    window.alert("Photo upplaods not yet implemented");
  }, []);
  const handlePressPrint = useCallback(() => {
    window.print();
  }, []);
  const handlePressAddToLibrary = useCallback(() => {
    window.alert("Add to library not yet implemented");
  }, []);
  const handlePressUpVote = useCallback(() => {
    window.alert("Upvote not yet implemented");
  }, []);
  const handlePressShare = useCallback(() => {
    window.navigator.share();
  }, []);
  const handlePressModify = useCallback(() => {
    const recipeSlug = actor.getSnapshot().context.recipe.slug;
    assert(recipeSlug, "expected recipeSlug");
    send({ type: "MODIFY", recipeSlug });
  }, [send, actor]);

  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4 mb-5">
      <Card className="flex flex-col gap-2 pb-5">
        <div className="flex flex-row gap-3 p-5 justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{name}</h1>
            <p className="text-lg text-muted-foreground">{description}</p>
            <Yield />
          </div>

          <div className="flex flex-col gap-1 hidden-print">
            <Button
              variant="outline"
              onClick={handlePressAddToLibrary}
              aria-label="Add To Library"
              className="flex flex-row gap-1"
            >
              <PlusSquareIcon />
            </Button>
            <Button
              variant="outline"
              onClick={handlePressPhoto}
              aria-label="Take Photo"
              className="flex flex-row gap-1"
            >
              <CameraIcon />
            </Button>
            <Button
              variant="outline"
              onClick={handlePressPrint}
              aria-label="Print"
              className="flex flex-row gap-1"
            >
              <PrinterIcon />
            </Button>
            {typeof window !== "undefined" && !!window.navigator?.canShare && (
              <Button
                suppressHydrationWarning
                variant="outline"
                className="flex flex-row gap-1"
                aria-label="Share"
                onClick={handlePressShare}
              >
                {/* <ArrowBigUpIcon color="green" /> */}
                <ShareIcon />
              </Button>
            )}
            <Button
              variant="outline"
              className="flex flex-row gap-1"
              aria-label="Upvote"
              onClick={handlePressUpVote}
            >
              {/* <ArrowBigUpIcon color="green" /> */}
              <ArrowBigUpDashIcon />
              <span className="font-bold">1</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-row gap-1"
              aria-label="Modify"
              onClick={handlePressModify}
            >
              {/* <ArrowBigUpIcon color="green" /> */}
              <ShuffleIcon />
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex flex-row gap-2 p-2 justify-center">
          <div className="flex flex-col gap-2 items-center">
            <CraftingDetails />
          </div>
        </div>
        <Separator />
        <Times />
        <Separator />
        <Keywords />
        <Separator />
        <RecipeIngredients />
        <Separator />
        <RecipeInstructions />
        <Separator />
      </Card>
      <Card>
        <Modify />
      </Card>
    </div>
  );
}

function Modify() {
  return (
    <form className="flex flex-col items-center">
      <div className="flex fex-row gap-2 items-center justify-between w-full p-4">
        <h4 className="font-semibold uppercase text-xs">Recrafting</h4>
        <ShuffleIcon />
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings2Icon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ingredients</DropdownMenuItem>
            <DropdownMenuItem>Cookware</DropdownMenuItem>
            <DropdownMenuItem>Techniques</DropdownMenuItem>
            <DropdownMenuItem>Diets</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
      <Separator />
      <div className="p-3 w-full">
        <div className="flex flex-col gap-2 items-start justify-centerj">
          <Label htmlFor="prompt">Modify this recipe.</Label>
          <div className="flex flex-col w-full gap-2 items-center">
            <Textarea
              placeholder="e.g. Can I use oil instead of butter?"
              className="w-full"
              name="prompt"
            />
            <Button
              size="lg"
              className="w-full flex flex-row gap-1 font-semibold"
            >
              <AxeIcon />
              <span>Craft</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function RecipeLoader({
  name,
  description,
  initialMessages,
  slug,
}: {
  name: string;
  description: string;
  slug: string;
  initialMessages: Message[];
}) {
  const store = useContext(RecipeViewerContext);
  const initRef = useRef(false);

  const [userMessage, assistantMessage] = useMemo(
    () => [
      initialMessages.find(isUserMessage),
      initialMessages.find(isAssistantMessage),
    ],
    [initialMessages]
  );

  const { messages, reload } = useChat({
    id: "recipe",
    api: `/api/recipe/${slug}`,
    initialMessages:
      userMessage && assistantMessage?.content
        ? [
            {
              id: userMessage.id,
              role: "user",
              content: userMessage.content,
            },
            {
              id: assistantMessage.id,
              role: "assistant",
              content: assistantMessage.content,
            },
          ]
        : [
            {
              id: nanoid(),
              role: "user",
              content: `*${name}*: ${description}`,
            },
          ],
  });

  useLayoutEffect(() => {
    if (!assistantMessage && !initRef.current) {
      initRef.current = true;
      reload().then(() => {
        // console.log("reloaded");
      });
    }
  }, [initRef, assistantMessage, reload]);

  const content = messages.filter((m) => m.role === "assistant")[0]?.content;
  useLayoutEffect(() => {
    store.setKey("content", content);
  }, [store, content]);

  return null;
}

function RecipeContentParser() {
  const store = useContext(RecipeViewerContext);

  const { content } = useStore(store, { keys: ["content"] });

  useLayoutEffect(() => {
    if (content && content !== "") {
      try {
        const json = yaml.load(content);
        const data = RecipeViewerDataSchema.parse(json);
        store.set({
          content,
          ...data,
        });
      } catch (ex) {
        // we expect that some errors are going to happen because we are
        // continuously parsing the yaml even if its not valid yaml
        // so if it fails, we just don't do anything
      }
    }
  }, [content, store]);

  return null;
}

const RecipeInstructions = () => {
  const store = useContext(RecipeViewerContext);
  const { recipeInstructions } = useStore(store, {
    keys: ["recipeInstructions"],
  });
  return (
    <div className="px-5">
      <div className="flex flex-row justify-between gap-1 items-center py-4">
        <h3 className="uppercase text-xs font-bold text-accent-foreground">
          Instructions
        </h3>
        <ScrollIcon />
      </div>
      {recipeInstructions && recipeInstructions.length > 0 ? (
        <div>
          <ol className="list-decimal pl-5">
            {recipeInstructions.map((step, index) => (
              <li key={index} className="mb-2">
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <Skeleton className="w-full h-64" />
      )}
    </div>
  );
};

const RecipeIngredients = () => {
  const store = useContext(RecipeViewerContext);
  const { recipeIngredient } = useStore(store, {
    keys: ["recipeIngredient"],
  });
  return (
    <div className="px-5">
      <div className="flex flex-row justify-between gap-1 items-center py-4">
        <h3 className="uppercase text-xs font-bold text-accent-foreground">
          Ingredients
        </h3>
        <ShoppingBasketIcon />
      </div>
      {recipeIngredient && recipeIngredient.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2">
          <ul className="list-disc pl-5">
            {recipeIngredient.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
      ) : (
        <Skeleton className="w-full h-64" />
      )}
    </div>
  );
};

const Yield = () => {
  const store = useContext(RecipeViewerContext);
  const { recipeYield } = useStore(store, {
    keys: ["recipeYield"],
  });

  return (
    <>
      <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
        <span>Yields</span>
        <span>
          {/* {recipeYield !== "" ? recipeYield : <Skeleton className="w-24 h-4" />} */}
          {!recipeYield || recipeYield === "" ? (
            <Skeleton className="w-24 h-5" />
          ) : (
            <>{recipeYield}</>
          )}
        </span>
      </div>
    </>
  );
};

const Times = () => {
  const store = useContext(RecipeViewerContext);
  const { prepTime, cookTime, totalTime } = useStore(store, {
    keys: ["prepTime", "cookTime", "totalTime"],
  });

  const formattedPrepTime = formatDuration(prepTime);
  const formattedCookTime = formatDuration(cookTime);
  const formattedTotalTime = formatDuration(totalTime);
  return (
    <div className="flex flex-row gap-2 px-5">
      <ClockIcon className="w-4 h-4 mr-2" />
      {(formattedPrepTime === "" ||
        formattedCookTime === "" ||
        formattedTotalTime === "") && <Skeleton className="flex-1" />}
      {formattedPrepTime != "" && (
        <Badge variant="outline">Prep {formattedPrepTime}</Badge>
      )}
      {formattedCookTime != "" && (
        <Badge variant="outline">Cook {formattedCookTime}</Badge>
      )}
      {formattedTotalTime != "" && (
        <Badge variant="outline">Total {formattedTotalTime}</Badge>
      )}
    </div>
  );
};

const Keywords = () => {
  const store = useContext(RecipeViewerContext);
  const { keywords: keywordsStr } = useStore(store, {
    keys: ["keywords"],
  });

  const keywords = keywordsStr?.split(",") || [];

  return (
    <div className="flex flex-row gap-2 px-5">
      <TagIcon />
      {keywords.length === 0 ? (
        <Skeleton className="flex-1" />
      ) : (
        <div className="flex flex-row gap-2 flex-wrap">
          {keywords.map((keyword) => {
            return <Badge key={keyword}>{keyword}</Badge>;
          })}
        </div>
      )}
    </div>
  );
};

function formatDuration(duration: string | undefined) {
  if (!duration) {
    return "";
  }
  const match = duration.match(/^PT(\d+H)?(\d+M)?(\d+S)?$/);
  if (!match) {
    return "";
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  const formattedParts = [];

  if (hours > 0) {
    formattedParts.push(`${hours}h`);
  }

  if (minutes > 0) {
    formattedParts.push(`${minutes}m`);
  }

  if (seconds > 0) {
    formattedParts.push(`${seconds}s`);
  }

  return formattedParts.join(" ");
}

const CraftingDetails = () => {
  // todo only do this if the userId of the recipe matches the userId of the active user
  const hasUsernameSet = true;

  const [formattedDate] = useState(() => {
    const now = new Date(); // todo actually store this on the recipe

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(now);
  });

  if (!hasUsernameSet) {
    return <EditUsername />;
  }

  return (
    <>
      <Label className="uppercase text-xs font-bold text-accent-foreground">
        Crafted By
      </Label>

      <Link
        href="/chef/InspectorT"
        className="flex flex-row gap-1 items-center"
      >
        <Badge variant="outline">
          <h3 className="font-bold text-xl">
            <div className="flex flex-col gap-1 items-center">
              <div className="flex flex-row gap-1 items-center">
                <ChefHatIcon />
                <span>
                  <span className="underline">InspectorT</span>
                </span>
              </div>
            </div>
          </h3>
        </Badge>{" "}
        <span className="font-bold">(+123 🧪)</span>
      </Link>
      <Label className="text-muted-foreground uppercase text-xs">
        {formattedDate.split(" at ").join(" @ ")}
      </Label>
    </>
  );
};

const editUsernameStore = map({
  input: "",
  isAvailable: undefined as boolean | undefined,
});

const EditUsername = () => {
  const send = useSend();
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handlePressSetUsername = useCallback(() => {
    // send({ type: "SET_USERNAME", value})
    setShowInput(true);
  }, [setShowInput]);

  const handleChangeValue: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      editUsernameStore.setKey("input", e.target.value);
    },
    []
  );

  const handleUsernameSubmit = useCallback(() => {
    const value = inputRef.current?.value;
    if (value && value != "") {
      send({ type: "SET_USERNAME", value: inputRef.current?.value });
    }
  }, [send, inputRef]);

  return showInput ? (
    <Button variant="ghost" onClick={handlePressSetUsername}>
      <h3 className="font-bold text-xl">
        🧪 <span className="underline">[Enter your chef name]</span>
      </h3>
    </Button>
  ) : (
    <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-2 px-3">
      <Label htmlFor="username" className="font-semibold" color="secondary">
        Username
      </Label>
      <UsernameIsAvailable />
      <Input name="username" onChange={handleChangeValue} />
      <p className="text-muted-foreground text-sm flex flex-row gap-1 items-center">
        <InfoIcon />
        <span>
          Your recipes will exist at kitchencraft.ai/
          <strong className="font-semibold">your-username</strong>.
        </span>
      </p>
      <Button className="w-full">Submit</Button>
    </form>
  );
};

const UsernameIsAvailable = () => {
  const { input, isAvailable } = useStore(editUsernameStore, {
    keys: ["input", "isAvailable"],
  });

  if (!isAvailable) {
    return null;
  }

  return <div>{input} is available</div>;
};
