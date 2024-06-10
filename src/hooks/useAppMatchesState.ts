import { AppState } from "@/app/app-machine";
import { useAppContext } from "./useAppContext";
import { useSelector } from "./useSelector";

export const useAppMatchesState = (matchedState: AppState) => {
  const actor = useAppContext();
  return useSelector(actor, (state) => state.matches(matchedState));
};
