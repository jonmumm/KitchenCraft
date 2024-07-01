import React, { useEffect, useRef, useCallback } from "react";

type InViewHookOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
};

function useInView(
  callback: () => void,
  options: InViewHookOptions = {}
): React.RefCallback<HTMLDivElement> {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) {
      observer.current.disconnect();
    }

    if (node) {
      observer.current = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          callbackRef.current();
          if (observer.current) {
            observer.current.disconnect();
          }
        }
      }, options);

      observer.current.observe(node);
    }
  }, [options]);

  return ref;
}

export default useInView;