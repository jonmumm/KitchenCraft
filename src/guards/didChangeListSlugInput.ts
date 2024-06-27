import { LIST_SLUG_INPUT_KEY } from "@/constants/inputs";
import { AppEvent } from "@/types";
import { AnyEventObject } from "xstate";

export const didChangeListSlugInput = ({ event }: { event: AppEvent | AnyEventObject }) => {
  return event.type === "CHANGE" && event.name === LIST_SLUG_INPUT_KEY;
};
