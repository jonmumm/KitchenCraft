"use client";

import { useSend } from "@/hooks/useSend";
import { Slot } from "@radix-ui/react-slot";
import { FormEventHandler, ForwardRefRenderFunction, useCallback } from "react";

interface EventInputProps extends React.HTMLProps<HTMLDivElement> {
  name: string;
  asChild?: boolean;
  children: React.ReactNode;
}

export const EventInput: ForwardRefRenderFunction<
  HTMLInputElement | HTMLTextAreaElement,
  EventInputProps
> = ({ name, asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "input";
  const send = useSend();

  const handleChange: FormEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      send({ type: "CHANGE", name, value: e.currentTarget.value });
    },
    [send, name]
  );

  return (
    <Comp onChange={handleChange} ref={ref as any} {...props}>
      {children}
    </Comp>
  );
};
