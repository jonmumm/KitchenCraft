"use client";

import { BookmarkIcon, Check } from "lucide-react";
import { Button, ButtonProps } from "./input/button";
import { Popover, PopoverContent, PopoverTrigger } from "./layout/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./input/command";

export const SaveButton = ({
  id,
  className,
  variant,
  showText = false,
}: {
  id?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  showText?: boolean;
}) => {
  if (!id) {
    return (
      <Button className={className} variant={variant || "ghost"} disabled>
        {showText && <>Save</>}
        <BookmarkIcon className={showText ? "ml-1" : ""} />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={className}
          variant={variant || "outline"}
          event={{ type: "SAVE_RECIPE", recipeId: id }}
        >
          {showText && <>Save</>}
          <BookmarkIcon className={showText ? "ml-1" : ""} />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search lists..." />
          <CommandList>
            <CommandEmpty>Empty</CommandEmpty>
            <CommandGroup>
              <CommandItem key="foo" value="bar">
                <Check />
                MyLabel
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
