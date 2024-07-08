import { QUESTION_IDS_KEYS } from "@/app/quiz/preferences/constants";

export const LIST_SLUG_INPUT_KEY = "listSlug";
export const EMAIL_INPUT_KEY = "email";
export const PROFILE_NAME_INPUT_KEY = "profileName";
export const SIGN_IN_CODE_INPUT_KEY = "signInCode";
export const GOALS_INPUT_KEY = "goals";
export const PROMPT_INPUT_KEY = "prompt";
export const SHARE_NAME_INPUT_KEY = "shareNameInput";
export const NEW_COMMENT_INPUT_KEY = "newComment";

export const INPUT_KEYS = [
  PROMPT_INPUT_KEY,
  LIST_SLUG_INPUT_KEY,
  EMAIL_INPUT_KEY,
  PROFILE_NAME_INPUT_KEY,
  SIGN_IN_CODE_INPUT_KEY,
  NEW_COMMENT_INPUT_KEY,
  GOALS_INPUT_KEY,
  SHARE_NAME_INPUT_KEY,
  ...Object.values(QUESTION_IDS_KEYS),
] as const;