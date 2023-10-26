"use client";

import { Textarea } from "@/components/ui/textarea";
import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useContext,
} from "react";
import { RemixContext } from "./remix-context";

export function RemixInput() {
  const store = useContext(RemixContext);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      store.setKey("prompt", e.target.value);
    },
    [store]
  );

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // Trigger form submission logic here. If your form uses a traditional submission,
        // you can select the form element and call its submit method.
        // If you're using some other logic, you'll need to trigger that here.
        const form = e.currentTarget.closest("form");
        if (form) {
          form.requestSubmit();
        }
      }
    },
    []
  );

  return (
    <Textarea
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="e.g. Can I use oil instead of butter? Shallots instead of onions?"
      className="w-full"
      name="prompt"
    />
  );
}
