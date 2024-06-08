import { AppContext } from "@/app/context";
import { useContext } from "react";

export const useAppContext = () => {
  return useContext(AppContext);
};
