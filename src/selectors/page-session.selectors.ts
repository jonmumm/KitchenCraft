import { PageSessionSnapshot } from "@/app/page-session-machine";

export const selectCurrentListRecipeIds = (state: PageSessionSnapshot) => {
  return (
    state.context.browserSessionSnapshot?.context.currentListRecipeIds || []
  );
};
