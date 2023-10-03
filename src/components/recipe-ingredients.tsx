"use client";

import { PromptContext } from "@/context/prompt";
import { useChat } from "ai/react";
import { useContext, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

export default function RecipeIngredients({}: {}) {
  const { messages, isLoading, append, setMessages, setInput, stop } = useChat({
    id: "ingredients",
    api: "/api/ingredients",
  });
  const prompt$ = useContext(PromptContext);

  useEffect(() => {
    return prompt$.listen(({ text }) => {
      if (text !== "") {
        stop();
        setMessages([]);
        append({ content: text, role: "user" }).then((val) => {
          console.log(val);
          // no-op
        });
      }
    });
  }, [prompt$, append, setMessages, stop, setInput]);

  const suggestions = messages[1]?.content;
  const items = suggestions?.split("\n").map((item) => item.trim());

  return (
    <>
      {items?.length > 0 && (
        <>
          <div className="flex flex-col gap-2 p-3">
            <h3 className="text-xs font-bold uppercase text-slate-500">
              Ingredients
            </h3>
            <div className="flex flex-row flex-wrap gap-1">
              {items.map((item) => {
                return <Badge key={item}>{item}</Badge>;
                // return <CommandItem key={name}>{description}</CommandItem>;
              })}
            </div>
          </div>
          <Separator />
        </>
      )}
    </>
    // <CommandList>
    //   {items?.length > 0 && (
    //     <CommandGroup heading="Suggestions">
    //       {items.map(([name, description]) => {
    //         console.log({ name, description });
    //         return <>{description}</>;
    //         // return <CommandItem key={name}>{description}</CommandItem>;
    //       })}
    //     </CommandGroup>
    //   )}
    // </CommandList>
  );
}
