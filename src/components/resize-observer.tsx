import { ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  onResize: ({ width, height }: { width: number; height: number }) => void;
};

function ResizeObserverComponent({ children, onResize }: Props) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;

    // Ensure ResizeObserver is available in the browser
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (onResize) {
            // Passing the contentRect which contains size information
            onResize(entry.contentRect);
          }
        }
      });

      resizeObserver.observe(element);

      return () => {
        // Cleanup observer on component unmount
        resizeObserver.disconnect();
      };
    }

    return () => {}; // Fallback cleanup function
  }, [onResize, containerRef]);

  return <div ref={containerRef}>{children}</div>;
}

export default ResizeObserverComponent;
