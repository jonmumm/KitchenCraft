import { useEffect, useState } from "react";

const usePushState = (): unknown => {
  // Initialize state with window.history.state if running in the browser
  const [state, setState] = useState<unknown>(
    typeof window !== "undefined" ? window.history.state : null
  );

  useEffect(() => {
    // Ensure window is defined (i.e., code is running in the browser)
    if (typeof window !== "undefined") {
      const handlePopState = (event: PopStateEvent) => {
        setState(event.state);
        event.preventDefault();
      };

      // Listen for popstate event
      window.addEventListener("popstate", handlePopState);

      // Clean up event listener
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, []);

  return state;
};

export default usePushState;
