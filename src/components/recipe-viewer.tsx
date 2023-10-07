"use client";

import { useSelector } from "@/hooks/useSelector";
import { assert } from "@/lib/utils";
import { isAssistantMessage, isUserMessage } from "@/type-utils";
import { Message, RecipeViewerData } from "@/types";
import { useStore } from "@nanostores/react";
import { nanoid } from "ai";
import { useChat } from "ai/react";
import * as yaml from "js-yaml";
import { listenKeys, map } from "nanostores";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RecipeChatContext } from "./recipe-chat";
import { RecipeViewerDataSchema } from "@/schema";

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
  // let data = {};
  // if (assistantMessage?.content && assistantMessage.state === "done") {
  //   try {
  //     const json = yaml.load(assistantMessage.content);
  //     const data = RecipeViewerDataSchema.parse(json);
  //     await kv.hset(`recipe:${slug}`, data);
  //   } catch (ex) {
  //     console.error("Error parsing yaml completion", ex);
  //   }
  // }

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
    onResponse(response) {
      console.log(response);
    },
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

const RecipeContent = () => {
  const store = useContext(RecipeViewerContext);
  const {
    prepTime,
    cookTime,
    totalTime,
    keywords,
    recipeYield,
    recipeCategory,
    recipeCuisine,
    recipeIngredient,
    recipeInstructions,
  } = useStore(store, {
    keys: [
      "prepTime",
      "cookTime",
      "totalTime",
      "keywords",
      "recipeYield",
      "recipeCategory",
      "recipeCuisine",
      "recipeIngredient",
      "recipeInstructions",
    ],
  });

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Recipe</h1>

      <div className="mb-4">
        <p>
          <strong>Prep Time:</strong> {prepTime}
        </p>
        <p>
          <strong>Cook Time:</strong> {cookTime}
        </p>
        <p>
          <strong>Total Time:</strong> {totalTime}
        </p>
        <p>
          <strong>Keywords:</strong> {keywords}
        </p>
        <p>
          <strong>Yield:</strong> {recipeYield}
        </p>
        <p>
          <strong>Category:</strong> {recipeCategory}
        </p>
        <p>
          <strong>Cuisine:</strong> {recipeCuisine}
        </p>
      </div>

      {recipeIngredient && recipeIngredient.length > 0 && (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
          <ul className="list-disc pl-5">
            {recipeIngredient.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
      )}

      {recipeInstructions && recipeInstructions.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Instructions</h2>
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

// const RecipeComponent = ({
//   result: recipeData,
// }: {
// }) => {
//   return (
//     <div className="max-w-2xl mx-auto p-4 bg-white shadow-md rounded-md">
//       <h2 className="text-2xl font-bold mb-4">Recipe</h2>
//       <p>
//         <strong>Preparation Time:</strong> {recipeData.prepTime}
//       </p>
//       <p>
//         <strong>Cook Time:</strong> {recipeData.cookTime}
//       </p>
//       <p>
//         <strong>Total Time:</strong> {recipeData.totalTime}
//       </p>
//       <p>
//         <strong>Keywords:</strong> {recipeData.keywords}
//       </p>
//       <p>
//         <strong>Yield:</strong> {recipeData.recipeYield}
//       </p>
//       <p>
//         <strong>Category:</strong> {recipeData.recipeCategory}
//       </p>
//       <p>
//         <strong>Cuisine:</strong> {recipeData.recipeCuisine}
//       </p>

//       <h3 className="text-xl font-semibold mt-4 mb-2">Ingredients</h3>
//       <ul className="list-disc pl-5">
//         {recipeData.recipeIngredient.map((ingredient, index) => (
//           <li key={index}>{ingredient}</li>
//         ))}
//       </ul>

//       <h3 className="text-xl font-semibold mt-4 mb-2">Instructions</h3>
//       <ol className="list-decimal pl-5">
//         {recipeData.recipeInstructions.map((instruction, index) => (
//           <li key={index}>{instruction.text}</li>
//         ))}
//       </ol>
//     </div>
//   );
// };
