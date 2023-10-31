import { parseAsArrayOf, parseAsString } from "next-usequerystate";

export const ingredientsParser = parseAsArrayOf(parseAsString)
  .withOptions({ history: "push" })
  .withDefault([]);
export const tagsParser = parseAsArrayOf(parseAsString).withDefault([]);
