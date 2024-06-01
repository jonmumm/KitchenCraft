import { AppContext } from "@/app/context";
import { PageSessionContext } from "@/app/page-session-store.context";
import { useContext } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { useSelector } from "./useSelector";

export const useCraftIsOpen = () => {
  const actor = useContext(AppContext);
  return useSelector(actor, (state) => state.matches({ Open: "True" }));
};

export const usePromptIsDirty = () => {
  const session$ = useContext(PageSessionContext);
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => session$.get().context,
    () => session$.get().context,
    (context) => context.prompt.length > 0
  );
};

export const usePromptIsPristine = () => {
  const session$ = useContext(PageSessionContext);
  return useSyncExternalStoreWithSelector(
    session$.subscribe,
    () => session$.get().context,
    () => session$.get().context,
    (context) => context.prompt.length === 0
  );
};
