import { CraftContext } from "@/app/context";
import { SessionStoreContext } from "@/app/page-session-store.context";
import { useContext } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { useSelector } from "./useSelector";

export const useCraftIsOpen = () => {
  const actor = useContext(CraftContext);
  return useSelector(actor, (state) => state.matches({ Open: "True" }));
};

export const usePromptIsDirty = () => {
  const session$ = useContext(SessionStoreContext);
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => session$.get().context,
    () => session$.get().context,
    (context) => context.prompt.length > 0
  );
};

export const usePromptIsPristine = () => {
  const session$ = useContext(SessionStoreContext);
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => session$.get().context,
    () => session$.get().context,
    (context) => context.prompt.length === 0
  );
};
