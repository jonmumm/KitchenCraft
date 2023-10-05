"use client";

import { useSelector } from "@/hooks/useSelector";
import { MessageContent, MessageRole } from "@/types";
import { useContext } from "react";
import { RecipeChatContext } from "./recipe-chat";

export default function RecipeViewer(props: {
  initialMessages: { role: MessageRole; content: MessageContent; id: string }[];
}) {
  const actor = useContext(RecipeChatContext);
  const name = useSelector(actor, (state) => state.context.name!);
  const description = useSelector(actor, (state) => state.context.description!);
  const slug = useSelector(actor, (state) => state.context.slug!);
  console.log(props.initialMessages);

  // todo load the initial messeages...

  //   useChat({
  //     id: "recipe",
  //     initialMessages: props.initialMessages,
  //   });

  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
      <p>{slug}</p>
    </div>
  );
}
