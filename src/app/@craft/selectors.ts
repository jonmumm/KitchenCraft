import { CraftSnapshot } from "../machine";

// export const selectIsInputting = (state: CraftSnapshot) =>
//   state.matches("Mode.New.Inputting");

// export const selectLockScroll = (state: CraftSnapshot) =>
//   !!(state.context.prompt?.length && state.context.prompt.length > 0);

// export const selectPromptEmpty = (state: CraftSnapshot) =>
//   !state.context.prompt?.length;

// export const selectInputHash = (state: CraftSnapshot) =>
//   state.context.submittedInputHash;

// export const selectIsNew = (state: CraftSnapshot) => state.matches("Mode.New");

// export const selectIsInputtingNew = (state: CraftSnapshot) =>
//   state.matches("Mode.New.Inputting");

// export const selectIsEmpty = (state: CraftSnapshot) => {
//   return (
//     !state.context.prompt &&
//     !state.context.ingredients?.length &&
//     !state.context.tags?.length
//   );
// };

// export const selectIsModifying = (state: CraftSnapshot) =>
//   state.matches("Mode.Modify");

// export const selectIsModifyingEquipment = (state: CraftSnapshot) =>
//   state.matches("Mode.Modify.Equipment");

// export const selectIsModifyingIngredients = (state: CraftSnapshot) =>
//   state.matches("Mode.Modify.Substitute");

// export const selectIsModifyingDietary = (state: CraftSnapshot) =>
//   state.matches("Mode.Modify.Dietary");

// export const selectIsModifyingScale = (state: CraftSnapshot) =>
//   state.matches("Mode.Modify.Scale");

export const selectIsOpen = (state: CraftSnapshot) => {
  return state.matches("OpenState.Open");
};

export const selectShowOverlay = (state: CraftSnapshot) => {
  return state.matches("OpenState.Open") && state.matches("Mode.New");
};

// export const selectInputIsPristine = ({ context }: CraftSnapshot) => {
//   if (
//     !context.prompt?.length &&
//     !context.ingredients?.length &&
//     !context.tags?.length
//   ) {
//     return false;
//   }

//   const hash = getObjectHash({
//     prompt: context.prompt,
//     ingredients: context.ingredients,
//     tags: context.tags,
//   });
//   return hash === context.submittedInputHash;
// };

export const selectIsCreating = (state: CraftSnapshot) =>
  !state.matches("Creating.False");

export const selectIsRemixing = (state: CraftSnapshot) =>
  state.matches("Mode.Remix");

export const selectIsTyping = (state: CraftSnapshot) =>
  state.matches("Typing.True");

export const selectPromptLength = (state: CraftSnapshot) =>
  state.context.prompt?.length || 0;

export const selectIsInstantRecipeLoading = (state: CraftSnapshot) =>
  state.matches("Mode.New.InstantRecipe.InProgress") || state.matches("Mode.New.InstantRecipe.Holding");

export const selectIsSuggestionsLoading = (state: CraftSnapshot) =>
  state.matches("Mode.New.Suggestions.InProgress") || state.matches("Mode.New.Suggestions.Holding");
  ;