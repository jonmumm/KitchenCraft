"use client";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useStore } from "@nanostores/react";
import { PlusSquareIcon } from "lucide-react";
import { atom } from "nanostores";
import { parseAsString, useQueryState } from "next-usequerystate";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { tagsParser } from "./query-params";

export const TagsGroup = ({}: {}) => {
  const [suggestions$] = useState(atom<string[]>([]));

  const SuggestionsFetcher = () => {
    const [prompt] = useQueryState("prompt", parseAsString);

    useEffect(() => {
      if (prompt && prompt.length) {
        fetch(`/api/tags?prompt=${prompt}`)
          .then((resp) => resp.json())
          .then(z.array(z.string()).parse)
          .then(suggestions$.set);
      } else {
        suggestions$.set([]);
      }
    }, [prompt]);

    return <></>;
  };

  const SuggestionsList = () => {
    const [tags, setTags] = useQueryState("tags", tagsParser);
    const [prompt, setPrompt] = useQueryState("prompt", parseAsString);
    const handleSelect = useCallback(
      (item: string) => {
        return () => {
          setTags([...tags, item]);
          suggestions$.set([]);
          setPrompt(null);
        };
      },
      [setTags, tags, setPrompt]
    );

    const suggestions = useStore(suggestions$);
    return suggestions.length || prompt ? (
      <CommandGroup heading="Tags">
        {suggestions.map((item) => {
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
        {prompt && (
          <CommandItem
            onSelect={handleSelect(prompt)}
            className="flex flex-row"
          >
            <span className="flex-1">
              <span className="italic">Add tag</span> &apos;
              <span className="font-bold">{prompt}</span>&apos;
            </span>
            <PlusSquareIcon className="opacity-50" />
          </CommandItem>
        )}
      </CommandGroup>
    ) : null;
  };

  return (
    <>
      <SuggestionsFetcher />
      <SuggestionsList />
    </>
  );
};
