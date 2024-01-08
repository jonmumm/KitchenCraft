import { useEffect, useRef } from "react";

interface EventSourceCallbacks {
  onStart?: (data: { resultId: string }) => void;
  onProgress?: (charArray: string, currentToken: string) => void;
  onComplete?: (charArray: string) => void;
  onError?: (error: Error) => void;
}

function useEventSource(url: string, callbacks: EventSourceCallbacks) {
  const charArrayRef = useRef<string>("");
  const callbacksRef = useRef(callbacks);

  // Update the ref value when callbacks change
  // This won't trigger a re-render or re-run the effect
  callbacksRef.current = callbacks;

  useEffect(() => {
    const source = new EventSource(url);
    let isStartMessageHandled = false;

    source.onmessage = (event) => {
      try {
        const currentToken = JSON.parse(event.data);

        if (!isStartMessageHandled) {
          callbacksRef.current.onStart?.({ resultId: currentToken });
          isStartMessageHandled = true;
        } else {
          charArrayRef.current += currentToken;
          callbacksRef.current.onProgress?.(charArrayRef.current, currentToken);
        }
      } catch (error) {
        callbacksRef.current.onError?.(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };

    source.onerror = () => {
      try {
        callbacksRef.current.onComplete?.(charArrayRef.current);
      } catch (error) {
        callbacksRef.current.onError?.(
          error instanceof Error ? error : new Error(String(error))
        );
      }

      source.close();
    };

    return () => {
      source.close();
    };
  }, [url]); // Only URL in the dependency array

  return charArrayRef;
}

export default useEventSource;
