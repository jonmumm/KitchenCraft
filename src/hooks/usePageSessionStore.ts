import { PageSessionContext } from "@/app/page-session-store.context";
import { useContext } from "react";

export const usePageSessionStore = () => {
  // todo take the context and add a matches method wrapper implementation
  return useContext(PageSessionContext);
};
