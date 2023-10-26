"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { nanoid } from "ai";
import { useEffect, useState } from "react";

export default function Page() {
  const [open, setOpen] = useState(false);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
    >
      <CommandInput />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Letters">
          <CommandItem>a</CommandItem>
          <CommandItem>b</CommandItem>
          <CommandSeparator />
          <CommandItem>c</CommandItem>
        </CommandGroup>

        <CommandItem>Apple</CommandItem>
      </CommandList>
    </CommandDialog>
  );
}
