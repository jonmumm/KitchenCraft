import { PageSessionSnapshot } from "@/app/page-session-machine";

export const selectCurrentListRecipeIds = (state: PageSessionSnapshot) => {
  return (
    state.context.browserSessionSnapshot?.context.selectedRecipeIds || []
  );
};

export const selectSelectedRecipeCount = (state: PageSessionSnapshot) =>
  state.context.browserSessionSnapshot?.context.selectedRecipeIds?.length ||
  0;
