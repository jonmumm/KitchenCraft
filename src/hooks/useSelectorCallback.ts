import { useEffect, useRef } from "react";
import { useSelector } from "./useSelector"; // assuming this is the path to your useSelector function
import type { ActorRef, SnapshotFrom } from "xstate";

export function useSelectorCallback<TActor extends ActorRef<any, any>, T>(
  actor: TActor,
  selector: (emitted: SnapshotFrom<TActor>) => T,
  callback: (currentValue: T, prevValue: T | undefined) => void,
  compare: (prev: T | undefined, next: T) => boolean = defaultCompare
): void {
  const currentValue = useSelector(actor, selector);
  const prevValueRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    if (prevValue === undefined || !compare(prevValue, currentValue)) {
      callback(currentValue, prevValue);
    }
    prevValueRef.current = currentValue;
  }, [currentValue, callback, compare]);
}

function defaultCompare<T>(a: T | undefined, b: T): boolean {
  return a === b;
}
