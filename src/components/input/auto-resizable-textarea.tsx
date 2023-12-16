import { cn } from "@/lib/utils";
import { SearchCodeIcon } from "lucide-react";
import React, {
  useRef,
  useCallback,
  useEffect,
  ReactNode,
  TextareaHTMLAttributes,
  ChangeEventHandler,
} from "react";

type Size = "xs" | "sm" | "md" | "lg"; // Extend with more sizes as needed

interface AutoResizableTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  size?: Size;
  placeholderComponent?: ReactNode; // Prop for the custom placeholder component
}

const sizeClassMap: Record<Size, { textSize: string; heightClass: string }> = {
  xs: { textSize: "text-xs", heightClass: "h-4" },
  sm: { textSize: "text-sm", heightClass: "h-5" },
  md: { textSize: "text-md", heightClass: "h-6" },
  lg: { textSize: "text-lg", heightClass: "h-7" },
};

const AutoResizableTextarea: React.FC<AutoResizableTextareaProps> = ({
  className,
  size = "lg",
  placeholderComponent,
  onChange,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Resize logic
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight, 10);
    const numberOfLines = Math.floor(textarea.scrollHeight / lineHeight);
    const requiredHeight = numberOfLines * lineHeight;
    textarea.style.height = `${requiredHeight}px`;
  }, []);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      onChange && onChange(e);
      resizeTextarea();
    },
    [onChange, resizeTextarea]
  );

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

  return (
    <label className="relative block flex-1 items-center">
      {/* {placeholderComponent && (
        <div
          className={`absolute top-0 left-0 transition-opacity opacity-100 pointer-events-none peer-focus:opacity-0`}
        >
          {placeholderComponent}
        </div>
      )} */}
      <textarea
        ref={textareaRef}
        className={`peer resize-none block w-full ${textSizeClass} ${heightClass} outline-none bg-transparent`}
        onChange={handleChange}
        // onChange={(e) => {
        //   handleSearch(e.target.value);
        // }}
        // defaultValue={searchParams.get("query")?.toString()}
      />
      <div className="absolute inset-0 transition-opacity duration-75 peer-focus:opacity-0">
        {placeholderComponent}
      </div>
      {/* <textarea
        ref={textareaRef}
        className={cn(
          `resize-none overflow-hidden ${textSizeClass} ${heightClass} peer`,
          className
        )}
        placeholder=" " // Space as placeholder to ensure CSS logic works
        {...props}
        onFocus={() => {
          console.log("focus");
        }}
        onChange={(e) => {
          if (props.onChange) {
            props.onChange(e);
          }
          resizeTextarea();
        }}
      /> */}
    </label>
  );
};

export default AutoResizableTextarea;
