import { PageSessionSnapshot } from "@/app/page-session-machine";

export const selectCurrentListRecipeIds = (state: PageSessionSnapshot) => {
  return (
    state.context.browserSessionSnapshot?.context.currentListRecipeIds || []
  );
};

export const selectCurrentListCount = (state: PageSessionSnapshot) =>
  state.context.browserSessionSnapshot?.context.currentListRecipeIds?.length ||
  0;
