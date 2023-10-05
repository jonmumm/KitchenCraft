"use client";

import { useSelector } from "@/hooks/useSelector";
import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { RecipeChatContext } from "./recipe-chat";
import { useChat } from "ai/react";
import {
  isAssistantMessage,
  isSystemMessage,
  isUserMessage,
  isUserOrAssistantMessage,
} from "@/type-utils";
import { nanoid } from "ai";
import { assert } from "@/lib/utils";

export default function RecipeViewer() {
  const actor = useContext(RecipeChatContext);
  const name = useSelector(actor, (state) => state.context.name!);
  const description = useSelector(actor, (state) => state.context.description!);
  const slug = useSelector(actor, (state) => state.context.slug);
  assert(slug, "expected slug to exist");
  const initialMessages = useSelector(
    actor,
    (state) => state.context.recipeMessages
  );
  const initRef = useRef(false);

  const userMessage = initialMessages.find(isUserMessage);
  const assistantMessage = initialMessages.find(isAssistantMessage);
  console.log({ userMessage, assistantMessage });
  // const hasAssistantContent = !!assistantMessage?.content;

  const { messages, isLoading, reload } = useChat({
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
    if (!assistantMessage?.content && !initRef.current) {
      initRef.current = true;
      reload().then(() => {
        console.log("reloaded");
      });
    }
  }, [initRef, assistantMessage, reload]);
  console.log({ messages });
  // const numMessages = actor.getSnapshot().context.messages.length;

  // useLayoutEffect(() => {
  //   if (numMessages === 0) {
  //     append({
  //       role: "user",
  //       content: `[${name}]: ${description}`,
  //     });
  //   }
  // }, [actor]);

  console.log({ messages });

  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
      <p>{slug}</p>
      {messages.map((m) => (
        <div key={m.id}>
          {m.role === "user" ? "User: " : "AI: "}
          {m.content}
        </div>
      ))}
    </div>
  );
}
