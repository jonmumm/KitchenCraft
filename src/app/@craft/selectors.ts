import { CraftSnapshot } from "./types";

export const selectIsInputting = (state: CraftSnapshot) =>
  state.matches("Mode.New.Inputting");

export const selectSlug = (state: CraftSnapshot) => state.context.slug;

export const selectLockScroll = (state: CraftSnapshot) =>
  !!(state.context.prompt?.length && state.context.prompt.length > 0);

export const selectPromptEmpty = (state: CraftSnapshot) =>
  !state.context.prompt?.length;

export const selectInputHash = (state: CraftSnapshot) =>
  state.context.inputHash;

export const selectIsNew = (state: CraftSnapshot) => state.matches("Mode.New");

export const selectIsEmpty = (state: CraftSnapshot) => {
  return (
    !state.context.prompt &&
    !state.context.ingredients?.length &&
    !state.context.tags?.length
  );
};

export const selectIsModifying = (state: CraftSnapshot) =>
  state.matches("Mode.Modify");

export const selectIsModifyingEquipment = (state: CraftSnapshot) =>
  state.matches("Mode.Modify.Equipment");

export const selectIsModifyingIngredients = (state: CraftSnapshot) =>
  state.matches("Mode.Modify.Substitute");

export const selectIsModifyingDietary = (state: CraftSnapshot) =>
  state.matches("Mode.Modify.Dietary");

export const selectIsModifyingScale = (state: CraftSnapshot) =>
  state.matches("Mode.Modify.Scale");

export const selectIsOpen = (state: CraftSnapshot) => {
  return state.matches("OpenState.Open");
};

export const selectShowOverlay = (state: CraftSnapshot) => {
  return state.matches("OpenState.Open") && state.matches("Mode.New");
};
