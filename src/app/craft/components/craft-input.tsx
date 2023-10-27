"use client";

import { CommandInput } from "@/components/ui/command";
// import { useFormStatus } from "react-dom";

import { useRouter } from "next/navigation";
import {
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export function CraftInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const initializedRef = useRef(false);
  // const replace = useMemo(() => {
  //   return debounce(router.replace, 200);
  // }, [router.replace]);

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

  const handleValueChange = useCallback(
    (value: string) => {
      setValue(value);
      const params = new URLSearchParams(window.location.search);

      // setPrompt(value);
      if (value !== "") {
        params.set("prompt", value);
      } else {
        params.delete("prompt");
      }

      // params.size is failing in safari for some reason
      const numParams = Array.from(params.keys()).length;

      if (numParams > 0) {
        router.replace(`/craft?${params.toString()}`);
      } else {
        router.replace(`/craft`);
      }
    },
    [setValue, router]
  );
  useEffect(() => {});

  const handleKeyDown: KeyboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = useCallback(
    (e) => {
      const prompt = inputRef.current?.value;
      if (e.key === "Enter" && !e.shiftKey && prompt !== "") {
        const url = `/craft/suggestions?prompt=${prompt}`;
        setSubmitting(true);
        router.push(url);
        // todo only prevent default if current selection is 1
        e.preventDefault();

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
      value={value}
      name="prompt"
      disabled={submitting}
      autoFocus
      // value={prompt}
      onKeyDown={handleKeyDown}
      onValueChange={handleValueChange}
      // disabled={!!prompt}
      placeholder="(e.g. leftover pizza, eggs and feta)"
    />
  );
}
