import { GlobalContext } from "@/context/application";
import { useStore } from "@nanostores/react";
import { useContext } from "react";

export const useIsMobile = () => {
  const appStore = useContext(GlobalContext);
  const { isMobile } = useStore(appStore, { keys: ["isMobile"] });
  return isMobile;
};
