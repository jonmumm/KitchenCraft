export const COOKING_GOALS = [
  "cook more often",
  "impress with what I cook",
  "instantly find the recipes I'm looking for",
  "diversify what I cook",
  "learn new cooking skills",
  "easily find recipes for ingredients I have",
] as const;

export type CookingGoal = (typeof COOKING_GOALS)[number];
