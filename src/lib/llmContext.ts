import {
  PREFERENCE_QUESTIONS_RECORD,
  QuestionId,
} from "@/app/quiz/preferences/constants";
import { PreferenceState, UserContext } from "@/types";

type PersonalizationOptions = Pick<
  UserContext,
  | "interests"
  | "goals"
  | "preferences"
  | "country"
  | "region"
  | "city"
  | "timezone"
>;

export function getTimeContext(timezone: string): string {
  const now = new Date();

  const optionsDate: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  };
  const formattedDate = new Intl.DateTimeFormat("en-US", optionsDate).format(
    now
  );

  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  };
  const formattedTime = new Intl.DateTimeFormat("en-US", optionsTime).format(
    now
  );

  const optionsDayOfWeek: Intl.DateTimeFormatOptions = {
    weekday: "long",
    timeZone: timezone,
  };
  const dayOfWeek = new Intl.DateTimeFormat("en-US", optionsDayOfWeek).format(
    now
  );

  return `Date: ${formattedDate}\nTime of Day: ${formattedTime}\nDay of Week: ${dayOfWeek}`;
}

export function getPersonalizationContext(
  options: PersonalizationOptions
): string {
  let context: string[] = [];

  // todo include preferences, interests, and goals in the context string
  // Include interests
  if (options.interests && options.interests.length > 0) {
    context.push(`Interests: ${options.interests.join(", ")}`);
  }

  // Include goals
  if (options.goals && options.goals.length > 0) {
    context.push(`Cooking Goals: ${options.goals.join(", ")}`);
  }

  // Include preferences
  const preferenceContext = getPreferencesContext(options.preferences);
  if (preferenceContext) {
    context.push(`Preferences:\n${preferenceContext}`);
  }

  if (options.city || options.country || options.timezone) {
    context.push(
      `Location: ${[options.city, options.region, options.country]
        .filter(Boolean)
        .join(", ")}${
        options.timezone ? ", Timezone: " + options.timezone : ""
      }`
    );
  }

  return context.join("\n");
}

function getPreferencesContext(preferences: PreferenceState): string {
  return Object.entries(preferences)
    .map(([questionId, answer]) => {
      const question = PREFERENCE_QUESTIONS_RECORD[questionId as QuestionId];
      if (!question) return null;

      let formattedAnswer: string;
      switch (question.type) {
        case "boolean":
          formattedAnswer = answer ? "Yes" : "No";
          break;
        case "multiple-choice":
          formattedAnswer = Array.isArray(answer)
            ? answer.join(", ")
            : String(answer);
          break;
        case "text":
          formattedAnswer = String(answer);
          break;
        default:
          return null;
      }

      return `${question.question} ${formattedAnswer}`;
    })
    .filter(Boolean)
    .join("\n");
}
