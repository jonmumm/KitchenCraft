"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SettingsIcon } from "lucide-react";
import { MouseEventHandler, useCallback } from "react";

export const ConjureActionSettings = () => {
  // todo need to handle this as the link level, currently doesnt work
  const handlePressSettings: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.preventDefault();
      return false;
    },
    []
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button onClick={handlePressSettings} variant="outline" size="icon">
          <SettingsIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent>Configure default Conjure settings</PopoverContent>
    </Popover>
  );
};
