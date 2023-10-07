"use client";

import { useSelector } from "@/hooks/useSelector";
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
  ClockIcon,
  PrinterIcon,
  SaveIcon,
  TagIcon,
} from "lucide-react";
import { map } from "nanostores";
import {
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
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

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
  const name = useSelector(actor, (state) => state.context.recipe.name);
  const description = useSelector(
    actor,
    (state) => state.context.recipe.description
  );
  const handlePressPrint = useCallback(() => {
    window.print();
  }, []);
  const handlePressSave = useCallback(() => {
    window.alert("Save not yet implemented");
  }, []);
  const handlePressUpVote = useCallback(() => {
    window.alert("Upvote not yet implemented");
  }, []);

  const [formattedDate] = useState(() => {
    const now = new Date(); // todo actually store this on the recipe

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(now);
  });

  return (
    <div className="max-w-2xl mx-auto p-4 pt-24 overflow-auto flex flex-col gap-2">
      <Card className="flex flex-col gap-2 pb-5 mb-5">
        <div className="flex flex-row gap-2 p-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{name}</h1>
            <p className="text-lg text-muted-foreground">{description}</p>
            <Yield />
          </div>

          <div className="flex flex-col gap-2 hidden-print">
            <Button
              variant="outline"
              onClick={handlePressPrint}
              className="flex flex-row gap-1"
            >
              <PrinterIcon />
            </Button>
            <Button
              variant="outline"
              onClick={handlePressSave}
              className="flex flex-row gap-1"
            >
              <SaveIcon />
            </Button>
            <Button
              variant="outline"
              className="flex flex-row gap-1"
              onClick={handlePressUpVote}
            >
              {/* <ArrowBigUpIcon color="green" /> */}
              <ArrowBigUpDashIcon />
              <span className="font-bold">1</span>
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex flex-row gap-2 p-2 justify-center">
          <div className="flex flex-row gap-4 items-center">
            <Label className="flex flex-col gap-2 items-center">
              <span className="text-xl">🧪</span>
              <span className="text-xs"> Crafted @</span>
            </Label>
            <Badge
              variant="outline"
              className="flex flex-col justify-center px-5 py-2"
            >
              {formattedDate.split(" at ").map((token) => (
                <span key={token}>{token}</span>
              ))}
            </Badge>
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
      </Card>
    </div>
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
        console.log("reloaded");
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
      <h3 className="uppercase text-xs font-bold text-accent-foreground my-2">
        Instructions
      </h3>
      {recipeInstructions && recipeInstructions.length > 0 && (
        <div>
          <ol className="list-decimal pl-5">
            {recipeInstructions.map((step, index) => (
              <li key={index} className="mb-2">
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
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
      <h3 className="uppercase text-xs font-bold text-accent-foreground my-2">
        Ingredients
      </h3>
      {recipeIngredient && recipeIngredient.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          <ul className="list-disc pl-5">
            {recipeIngredient.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Yield = () => {
  const store = useContext(RecipeViewerContext);
  const { recipeYield } = useStore(store, {
    keys: ["recipeYield"],
  });

  return <p className="text-sm text-muted-foreground">Yields {recipeYield}</p>;
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
      <TagIcon className="w-4 h-4 mr-2" />
      <div className="flex flex-row gap-2 flex-wrap">
        {keywords.map((keyword) => (
          <Badge key={keyword}>{keyword}</Badge>
        ))}
      </div>
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
