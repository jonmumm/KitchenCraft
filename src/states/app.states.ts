import { AppState } from "@/app/app-machine";

export const IS_CREATING_LIST: AppState = {
  Lists: { Creating: "True" },
};
export const IS_SELECTING_LIST: AppState = { Lists: { Selecting: "True" } };
