import { GlobalContext } from "@/context/application";
import { useStore } from "@nanostores/react";
import { useContext } from "react";

export const useAppSessionId = () => {
  const appStore = useContext(GlobalContext);
  const { appSessionId } = useStore(appStore, { keys: ["appSessionId"] });
  return appSessionId;
};
