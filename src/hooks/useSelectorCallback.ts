import { useEffect, useRef } from "react";
import type { ActorRef, SnapshotFrom } from "xstate";

export function useSelectorCallback<TActor extends ActorRef<any, any>, T>(
  actor: TActor,
  selector: (emitted: SnapshotFrom<TActor>) => T,
  callback: (currentValue: T, prevValue: T | undefined) => void,
  compare: (prev: T | undefined, next: T) => boolean = defaultCompare
): void {
  const prevValueRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    return actor.subscribe((state) => {
      const currentValue = selector(state);
      const prevValue = prevValueRef.current;
      if (prevValue === undefined || !compare(prevValue, currentValue)) {
        callback(currentValue, prevValue);
      }
      prevValueRef.current = currentValue;
    }).unsubscribe;
  }, [actor, selector, callback, compare]);
}

function defaultCompare<T>(a: T | undefined, b: T): boolean {
  return a === b;
}
