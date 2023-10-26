import { KeyboardEventHandler, useCallback } from "react";

export const useSubmitOnEnter = () => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement | HTMLInputElement> = useCallback(
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
  return { handleKeyDown };
};
