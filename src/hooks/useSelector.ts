import { useCallback, useSyncExternalStore } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";

import type { ActorRef, SnapshotFrom } from "xstate";

function defaultCompare<T>(a: T, b: T) {
  return a === b;
}

export function useSelectorSSR<TActor extends ActorRef<any, any>, T, TSSR>(
  actor: TActor,
  selector: (emitted: SnapshotFrom<TActor>) => T,
  ssrValue: T
): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { unsubscribe } = actor.subscribe(onStoreChange);
      return unsubscribe;
    },
    [actor]
  );

  return useSyncExternalStore(
    subscribe,
    () => selector(actor.getSnapshot()),
    () => ssrValue
  );
}

export function useSelector<TActor extends ActorRef<any, any>, T, TSSR>(
  actor: TActor,
  selector: (emitted: SnapshotFrom<TActor>) => T
): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { unsubscribe } = actor.subscribe(onStoreChange);
      return unsubscribe;
    },
    [actor]
  );

  const clientGetSnapshot = useCallback(() => actor.getSnapshot(), [actor]);
  const serverGetSnapshot = useCallback(() => actor.getSnapshot(), [actor]);

  const selectedSnapshot = useSyncExternalStoreWithSelector(
    subscribe,
    clientGetSnapshot,
    serverGetSnapshot,
    selector,
    defaultCompare
  );

  return selectedSnapshot;
}
