import { useCallback } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";

import type { ActorRef, SnapshotFrom } from "xstate";

function defaultCompare<T>(a: T, b: T) {
  return a === b;
}

export function useSelector<TActor extends ActorRef<any, any>, T>(
  actor: TActor,
  selector: (emitted: SnapshotFrom<TActor>) => T,
): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { unsubscribe } = actor.subscribe(onStoreChange);
      return unsubscribe;
    },
    [actor]
  );

  const boundGetSnapshot = useCallback(() => actor.getSnapshot(), [actor]);

  const selectedSnapshot = useSyncExternalStoreWithSelector(
    subscribe,
    boundGetSnapshot,
    boundGetSnapshot,
    selector,
    defaultCompare
  );

  return selectedSnapshot;
}
