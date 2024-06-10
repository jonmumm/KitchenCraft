import { AppSnapshot } from "@/app/app-machine";
import { useAppContext } from "./useAppContext";
import { useSelector } from "./useSelector";

export const useAppSelector = <T>(selector: (snapshot: AppSnapshot) => T) => {
  const actor = useAppContext();
  return useSelector(actor, selector);
};
