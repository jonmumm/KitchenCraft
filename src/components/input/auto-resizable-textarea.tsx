"use client";

import { CraftContext } from "@/app/context";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";

import React, {
  ChangeEventHandler,
  ReactNode,
  RefObject,
  TextareaHTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type Size = "xs" | "sm" | "md" | "lg"; // Extend with more sizes as needed

interface AutoResizableTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  size?: Size;
  placeholderComponent?: ReactNode; // Prop for the custom placeholder component
  initialValue?: string;
}

const sizeClassMap: Record<Size, { textSize: string; heightClass: string }> = {
  xs: { textSize: "text-xs", heightClass: "h-4" },
  sm: { textSize: "text-sm", heightClass: "h-5" },
  md: { textSize: "text-md", heightClass: "h-6" },
  lg: { textSize: "text-lg", heightClass: "h-7" },
};

const AutoResizableTextarea: React.FC<
  AutoResizableTextareaProps & { ref?: RefObject<HTMLTextAreaElement> }
> = ({
  className,
  size = "lg",
  placeholderComponent,
  onChange,
  initialValue,
  ...props
}) => {
  const send = useSend();
  const actor = useContext(CraftContext);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      send({ type: "HYDRATE_INPUT", ref: textareaRef.current });
    }
  }, [send]);
  const ref = props.ref || textareaRef;
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "28px"; // the h-7 line-height value, todo make dynamic

    // Resize logic
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight, 10);
    const isCrafting = document.body.classList.contains("crafting");
    const numberOfLines = isCrafting
      ? Math.floor(textarea.scrollHeight / lineHeight)
      : 1;
    const requiredHeight = numberOfLines * lineHeight;
    textarea.style.height = `${requiredHeight}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
    window.addEventListener("resize", resizeTextarea);
    return () => window.removeEventListener("resize", resizeTextarea);
  }, [resizeTextarea]);

  useEffect(() => {
    resizeTextarea();
  }, [props.value, size, resizeTextarea]);

  const textSizeClass =
    sizeClassMap[size]?.textSize || sizeClassMap["md"].textSize;
  const heightClass =
    sizeClassMap[size]?.heightClass || sizeClassMap["md"].heightClass;

  const Placeholder = () => {
    const actor = useContext(CraftContext);
    const hasPrompt = useSelector(
      actor,
      (state) => !!state.context.prompt?.length
    );

    return (
      !hasPrompt && (
        <div className="absolute inset-0 transition-opacity duration-75 crafting:opacity-0 pointer-events-none">
          {placeholderComponent}
        </div>
      )
    );
  };

  const Textarea = () => {
    const actor = useContext(CraftContext);
    const value = useSelector(actor, (state) => state.context.prompt);
    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
      (e) => {
        onChange && onChange(e);
        resizeTextarea();
      },
      []
    );

    return (
      <textarea
        value={value}
        ref={ref}
        className={`peer resize-none block w-full ${textSizeClass} ${heightClass} outline-none bg-transparent overflow-y-hidden`}
        onChange={handleChange}
        {...props}
        // onChange={(e) => {
        //   handleSearch(e.target.value);
        // }}
        // defaultValue={searchParams.get("query")?.toString()}
      />
    );
  };

  return (
    <div className="relative block flex-1 items-center mr-3">
      <Textarea />
      <Placeholder />
    </div>
  );
};

export default AutoResizableTextarea;
