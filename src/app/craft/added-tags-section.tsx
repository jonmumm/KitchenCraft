"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { XIcon } from "lucide-react";
import { useQueryState } from "next-usequerystate";
import { useCallback } from "react";
import { tagsParser } from "./query-params";

const AddedTagsList = () => {
  const [tags, setTags] = useQueryState("tags", tagsParser);

  const handlePressItem = useCallback(
    (item: string) => {
      return () => {
        const params = new URLSearchParams(window.location.search);
        const tags = (params.get("tags")?.split(",") || []).map((item) =>
          decodeURIComponent(item)
        );

        const nextTags = tags.filter((tag) => tag !== item);
        if (nextTags.length) {
          setTags(nextTags);
        } else {
          setTags(null);
        }
      };
    },
    [setTags]
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

export const AddedTagsSection = () => {
  const [tags] = useQueryState("tags", tagsParser);

  return tags?.length ? (
    <div className="px-5">
      <Label className="text-muted-foreground uppercase text-xs">Tags</Label>
      <AddedTagsList />
    </div>
  ) : null;
};
