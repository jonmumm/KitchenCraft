"use client";

import React, {
  ChangeEvent,
  TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from "react";
import "./auto-resizing-textarea.css";

// interface AutoResizingTextareaProps {
//   value?: string;
//   onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
//   placeholder?: string;
// }

type AutoResizingTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoResizingTextarea: React.FC<AutoResizingTextAreaProps> = ({
  value,
  onChange,
  placeholder,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.dispatchEvent(
        new Event("input", {
          bubbles: true,
          cancelable: true,
        })
      );
    }
  }, []);

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (!onChange) {
        return;
      }
      if (wrapperRef.current) {
        wrapperRef.current.dataset.replicatedValue = e.target.value;
      }
      onChange(e);
    },
    [onChange]
  );

  return (
    <div
      className="grow-wrap relative w-full max-w-full"
      ref={wrapperRef}
      data-replicated-value={value}
    >
      <textarea
        className="auto-resize-textarea resize-none overflow-x-hidden w-full p-2 border rounded"
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        rows={1}
        ref={textareaRef}
        {...props}
      />
    </div>
  );
};

AutoResizingTextarea.defaultProps = {
  placeholder: "Placeholder shows here",
};

export default AutoResizingTextarea;
