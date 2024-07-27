import { z } from "zod";

// Constants for question IDs
export const QUESTION_IDS_KEYS = {
  DIETARY_RESTRICTIONS: "dietary_restrictions",
  DIETARY_DETAILS: "dietary_details",
  COOKING_FREQUENCY: "cooking_frequency",
  COOKING_FREQUENCY_OTHER: "cooking_frequency_other",
  PREFERRED_CUISINE: "preferred_cuisine",
  CUISINE_DETAILS: "cuisine_details",
  OTHER_PREFERENCES: "other_preferences",
} as const;

export const QuestionIdsSchema = z.enum([
  QUESTION_IDS_KEYS.DIETARY_RESTRICTIONS,
  QUESTION_IDS_KEYS.DIETARY_DETAILS,
  QUESTION_IDS_KEYS.COOKING_FREQUENCY,
  QUESTION_IDS_KEYS.COOKING_FREQUENCY_OTHER,
  QUESTION_IDS_KEYS.PREFERRED_CUISINE,
  QUESTION_IDS_KEYS.CUISINE_DETAILS,
  QUESTION_IDS_KEYS.OTHER_PREFERENCES,
]);

// Root question IDs
export const ROOT_QUESTION_IDS = [
  QUESTION_IDS_KEYS.DIETARY_RESTRICTIONS,
  QUESTION_IDS_KEYS.COOKING_FREQUENCY,
  QUESTION_IDS_KEYS.PREFERRED_CUISINE,
  QUESTION_IDS_KEYS.OTHER_PREFERENCES,
] as const;

export type QuestionId =
  (typeof QUESTION_IDS_KEYS)[keyof typeof QUESTION_IDS_KEYS];

export type BaseQuestion = {
  id: QuestionId;
  question: string;
  explanation: string;
};

export type BooleanQuestion = BaseQuestion & {
  type: "boolean";
  options: readonly ["Yes", "No"];
  followUpQuestionId?: QuestionId;
};

export type MultipleChoiceQuestion = BaseQuestion & {
  type: "multiple-choice";
  options: readonly string[];
  followUpQuestionId?: QuestionId;
};

export type TextQuestion = BaseQuestion & {
  type: "text";
};

export type PreferenceQuestion =
  | BooleanQuestion
  | MultipleChoiceQuestion
  | TextQuestion;

const PREFERENCE_QUESTIONS: readonly PreferenceQuestion[] = [
  {
    id: QUESTION_IDS_KEYS.DIETARY_RESTRICTIONS,
    question: "Do you have any specific dietary restrictions or preferences?",
    type: "boolean",
    options: ["Yes", "No"],
    followUpQuestionId: QUESTION_IDS_KEYS.DIETARY_DETAILS,
    explanation:
      "This helps KitchenCraft tailor recipe recommendations to your specific dietary needs, ensuring that it suggests meals that align with your health goals or personal choices.",
  },
  {
    id: QUESTION_IDS_KEYS.DIETARY_DETAILS,
    question:
      "Please share more about your dietary restrictions or preferences.",
    type: "text",
    explanation:
      "KitchenCraft will do its best to match them, but always double-check recipes before cooking.",
  },
  {
    id: QUESTION_IDS_KEYS.COOKING_FREQUENCY,
    question: "What's your ideal cooking frequency?",
    type: "multiple-choice",
    options: [
      "Almost every day",
      "Only weekends",
      "1-3 times a week",
      "Less than once a week",
      "Other",
    ],
    followUpQuestionId: QUESTION_IDS_KEYS.COOKING_FREQUENCY_OTHER,
    explanation:
      "Understanding how often you cook helps KitchenCraft recommend an appropriate number of recipes and meal plans that fit your lifestyle and schedule.",
  },
  {
    id: QUESTION_IDS_KEYS.COOKING_FREQUENCY_OTHER,
    question: "Please provide more details about your cooking frequency.",
    type: "text",
    explanation:
      "This allows for a more precise understanding of your cooking habits.",
  },
  {
    id: QUESTION_IDS_KEYS.PREFERRED_CUISINE,
    question: "Do you have a type of cuisine you prefer to cook?",
    type: "boolean",
    options: ["Yes", "No"],
    followUpQuestionId: QUESTION_IDS_KEYS.CUISINE_DETAILS,
    explanation:
      "Knowing your preferred cuisines allows KitchenCraft to suggest recipes that match your taste preferences, making your cooking experience more enjoyable.",
  },
  {
    id: QUESTION_IDS_KEYS.CUISINE_DETAILS,
    question: "Please share your preferred cuisines.",
    type: "text",
    explanation:
      "This provides specific information about your cuisine preferences.",
  },
  {
    id: QUESTION_IDS_KEYS.OTHER_PREFERENCES,
    question: "Any other kitchen related preferences you'd like to share? (e.g. favorite equipment, tools, techniques, ingredients)",
    type: "text",
    explanation:
      "This helps KitchenCraft understand your unique cooking style and habits to provide more personalized recommendations. You can mention the type of grocery stores you like to shop at, any specific kitchen equipment you prefer using, or any other unique cooking habits you have.",
  },
] as const;

// New type definition for the record of preference questions
export type PreferenceQuestionsRecord = {
  [K in QuestionId]: PreferenceQuestion;
};

// Create the record of preference questions
export const PREFERENCE_QUESTIONS_RECORD: PreferenceQuestionsRecord =
  PREFERENCE_QUESTIONS.reduce((acc, question) => {
    acc[question.id] = question;
    return acc;
  }, {} as PreferenceQuestionsRecord);

export type PreferenceAnswer = string | string[] | boolean;

// The getPreferences function has been removed as it's not clear how it should be updated
// without more context about its usage in the new structure.

// export const getPreferences = (preferences: Record<number, number>): string => {
//   return Object.entries(preferences)
//     .map(([questionIndex, answerIndex]) => {
//       const question = PREFERENCE_QUESTIONS[Number(questionIndex)]!;
//       return `${question.question} ${question.options[Number(answerIndex)]}`;
//     })
//     .join("\n");
// };
