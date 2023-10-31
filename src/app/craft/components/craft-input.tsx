"use client";

import { CommandInput } from "@/components/ui/command";
// import { useFormStatus } from "react-dom";

import { parseAsString, useQueryState } from "next-usequerystate";
import { useRouter } from "next/navigation";
import {
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export function CraftInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prompt, setPrompt] = useQueryState("prompt", parseAsString);
  const initializedRef = useRef(false);

  // const replace = useMemo(() => {
  //   return debounce(router.replace, 200);
  // }, [router.replace]);
  const handleChange = useCallback(
    (value: string) => {
      console.log({ value });
      if (value !== "") {
        setPrompt(value);
      } else {
        setPrompt(null);
      }
    },
    [setPrompt]
  );

  useEffect(() => {
    if (
      !initializedRef.current &&
      inputRef.current &&
      defaultValue &&
      defaultValue !== ""
    ) {
      inputRef.current.select();
    }
    initializedRef.current = true;
  }, [initializedRef, inputRef, defaultValue]);

  const handleKeyDown: KeyboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = useCallback(
    (e) => {
      const prompt = inputRef.current?.value;
      if (e.key === "Enter" && !e.shiftKey) {
        const params = new URLSearchParams(window.location.search);

        const prompt = params.get("prompt");
        const ingredients = params.get("ingredients");
        console.log({ params, prompt, ingredients });

        if (prompt?.length || ingredients?.length) {
          const url = `/craft/suggestions?${params.toString()}`;
          setSubmitting(true);
          console.log({ url });
          router.push(url);
        }
        e.preventDefault();

        // todo only prevent default if current selection is 1

        // Trigger form submission logic here. If your form uses a traditional submission,
        // you can select the form element and call its submit method.
        // If you're using some other logic, you'll need to trigger that here.
        // router.replace(
        //   `/craft?prompt=${encodeURIComponent(
        //     inputRef.current!.value
        //   )}&actionType=conjure`,
        //   {}
        // );
      }
    },
    [router, setSubmitting]
  );

  return (
    <CommandInput
      ref={inputRef}
      value={prompt || ""}
      name="prompt"
      disabled={submitting}
      autoFocus
      // value={prompt}
      // onKeyDown={handleKeyDown}
      onValueChange={handleChange}
      // disabled={!!prompt}
      placeholder="(e.g. leftover pizza, eggs and feta)"
    />
  );
}
