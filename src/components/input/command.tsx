"use client";

import { DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import {
  ChevronRight,
  Loader2Icon,
  Search,
  SendHorizonalIcon,
  XSquareIcon,
} from "lucide-react";
import * as React from "react";

import { Dialog, DialogContent } from "@/components/layout/dialog";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { AppEvent } from "@/types";
import { VariantProps, cva } from "class-variance-authority";
import { Badge } from "../display/badge";
import { EventButton } from "../event-button";
import { Button } from "./button";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
    preIcon?: "search" | "prompt";
    postIcon?: "send" | "spinner";
  }
>(({ className, postIcon, preIcon = "prompt", ...props }, ref) => {
  const isEmpty = useCommandState((search) => search.search === "");

  return (
    <div className="flex items-center px-3" cmdk-input-wrapper="">
      {preIcon !== "prompt" && (
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      )}
      {preIcon === "prompt" && (
        <ChevronRight className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      )}
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {postIcon === "send" && (
        <Button event={{ type: "SUBMIT" }} size="icon" variant="ghost">
          <SendHorizonalIcon className={isEmpty ? "opacity-50" : ""} />
        </Button>
      )}
      {postIcon === "spinner" && <Loader2Icon className="animate-spin" />}
    </div>
  );
});

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "py-2 px-3 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase",
      className
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;
// Add your CommandItem variants here
const commandItemVariants = cva(
  [
    "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-offset-2",
    "aria-selected:bg-slate-500 aria-selected:text-hicontrast-foreground",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        // ghost: "bg-transparent hover:bg-gray-100 hover:text-gray-900",
        card: "shadow-lg rounded-xl",
      },
    },
    // defaultVariants: {
    //   variant: "ghost",
    // },
  }
);

// Extend the CommandItem component props to include variants
export interface CommandItemProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>,
    VariantProps<typeof commandItemVariants> {
  event?: AppEvent | (() => AppEvent);
}

// Update your CommandItem component to use the new variant prop
const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>(({ event, variant, className, ...props }, ref) => {
  const send = useSend();
  const handleSelect = React.useCallback(() => {
    if (typeof event === "function") {
      send(event());
    } else if (typeof event === "object") {
      send(event);
    }
  }, [event, send]);

  return (
    <CommandPrimitive.Item
      ref={ref}
      onSelect={event ? handleSelect : undefined}
      className={cn(commandItemVariants({ variant }), className)}
      {...props}
    />
  );
});

CommandItem.displayName = "CommandItem";

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export const CommandItemClearPrompt = () => {
  const send = useSend();
  const search = useCommandState((state) => state.search);

  const handleSelect = React.useCallback(() => {
    send({ type: "CLEAR" });
  }, [send]);

  return search.length ? (
    <CommandItem
      onSelect={handleSelect}
      className="flex flex-row justify-center py-3"
    >
      <Badge variant="secondary" className="flex flex-row gap-1">
        <span>Clear</span>
        <XSquareIcon size={14} />
      </Badge>
    </CommandItem>
  ) : null;
};

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
