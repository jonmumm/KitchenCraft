import { PageSessionContext } from "@/app/page-session-store.context";
import { useContext } from "react";

export const useSessionStore = () => {
  return useContext(PageSessionContext);
};
