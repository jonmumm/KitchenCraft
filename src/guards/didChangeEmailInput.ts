import { EMAIL_INPUT_KEY } from "@/constants/inputs";
import { AppEvent } from "@/types";
import { AnyEventObject } from "xstate";

export const didChangeEmailInput = ({ event }: { event: AppEvent | AnyEventObject }) => {
  return event.type === "CHANGE" && event.name === EMAIL_INPUT_KEY;
};
