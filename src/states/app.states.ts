import { AppState } from "@/app/machine";

export const IS_CREATING_LIST: AppState = {
  Lists: { Selecting: { True: { Creating: "True" } } },
};
export const IS_SELECTING_LIST: AppState = { Lists: { Selecting: "True" } };
