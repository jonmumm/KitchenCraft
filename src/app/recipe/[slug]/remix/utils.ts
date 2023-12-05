import { NewRecipe, Recipe } from "@/db/types";
import { diff_match_patch } from "diff-match-patch";

const dmp = new diff_match_patch();

export const calculateDiffs = (oldRecipe: Recipe, newRecipe: NewRecipe) => {
  let diffs: Record<string, any> = {};

  // List of keys to compare
  const keysToCompare: Array<keyof Recipe> = [
    "name",
    "description",
    "yield",
    "tags",
    "activeTime",
    "cookTime",
    "totalTime",
    "ingredients",
    "instructions",
  ];

  keysToCompare.forEach((key) => {
    if (oldRecipe[key] !== newRecipe[key]) {
      const diff = dmp.diff_main(
        JSON.stringify(oldRecipe[key]),
        JSON.stringify(newRecipe[key])
      );
      dmp.diff_cleanupSemantic(diff);
      if (diff.length) {
        diffs[key] = diff;
      }
    }
  });

  return diffs;
};
