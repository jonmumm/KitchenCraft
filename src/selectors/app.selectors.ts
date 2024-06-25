// todo put all client selectors here

import { AppSnapshot } from "@/app/app-machine";
import { createSelector } from "reselect";

export const selectCraftIsOpen = (state: AppSnapshot) =>
  state.matches({ Open: "True" });

export const selectCurrentListSlug = (state: AppSnapshot) => {
  return state.context.currentListSlug;
};

export const selectCurrentListIsSelected = createSelector(
  selectCurrentListSlug,
  (state) => state === "selected"
);

export const selectHasSubmittedPrompt = (state: AppSnapshot) => {
  return !!state.context.submittedPrompt.length;
};

export const selectHistory = (state: AppSnapshot) => {
  return state.context.history;
};

export const selectCanGoBack = createSelector(selectHistory, (history) => {
  console.log({ history });
  return history.length > 1;
});
