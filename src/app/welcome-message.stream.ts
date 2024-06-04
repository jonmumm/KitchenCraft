import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { assert } from "@/lib/utils";
import { z } from "zod";
import { PREFERENCE_QUESTIONS } from "./quiz/preferences/constants";

// PREFERENCE_QUESTIONS -- list of questions

export const WelcomeMessageOutputSchema = z.object({
  message: z
    .string()
    .describe(
      "2-3 paragraphs explaining how KitchenCraft will help use the provided information to suggest recipes you may like."
    ),
  followUpQuestions: z
    .array(z.string())
    .describe(
      "A list of 3 follow-up questions relevant to the user's answers that will be asked to further develop their preferences."
    ),
});

const WELCOME_MESSAGE = "WELCOME_MESSAGE";

export type WelcomeMessageEvent = StreamObservableEvent<
  typeof WELCOME_MESSAGE,
  z.infer<typeof WelcomeMessageOutputSchema>
>;

export type WelcomeMessageInput = {
  profileName: string;
  preferences: Record<number, number>;
  personalizationContext: string;
};

export type WelcomeMessageOutput = z.infer<typeof WelcomeMessageOutputSchema>;

export class WelcomeMessageStream extends StructuredObjectStream<
  WelcomeMessageInput,
  WelcomeMessageOutput
> {
  protected getSchema(): z.ZodType<
    WelcomeMessageOutput,
    z.ZodTypeDef,
    WelcomeMessageOutput
  > {
    return WelcomeMessageOutputSchema;
  }

  protected getName(): string {
    return WELCOME_MESSAGE;
  }

  protected async getUserMessage(input: WelcomeMessageInput): Promise<string> {
    const preferencesDescription = PREFERENCE_QUESTIONS.map(
      (question, index) => {
        const preference = input.preferences[index];
        assert(preference !== undefined, "expected preference at index");
        const selectedOption = question.options[preference];
        return `${question.question} ${selectedOption}`;
      }
    ).join("\n");

    return `
Profile Name: ${input.profileName}
Personalization Context: ${input.personalizationContext}
Preferences:
${preferencesDescription}
    `;
  }

  protected async getSystemMessage(
    input: WelcomeMessageInput
  ): Promise<string> {
    return `
You are an expert chef assistant. The user has provided their profile name, preferences, and a personalization context.

Based on the information provided, generate a welcome message for the user's chef profile page. This message should explain how KitchenCraft will use the provided information to suggest recipes that the user may like. Additionally, generate three follow-up questions relevant to the user's answers to further develop their preferences.

Example output:

{
  "message": "Welcome to KitchenCraft, ${input.profileName}! We're excited to help you discover new and delicious recipes tailored to your tastes and preferences. By understanding your unique culinary interests and habits, we'll provide you with personalized recipe suggestions that are perfect for you and your family. Whether you're looking for quick weeknight dinners, meal prep ideas, or something special for the weekend, we've got you covered. \n\nAs you continue to use KitchenCraft, our recommendations will become even more attuned to your preferences, making it easier for you to find recipes you'll love. We hope you enjoy exploring new dishes and creating memorable meals with us. Happy cooking!",
  "followUpQuestions": [
    "What types of cuisines do you enjoy the most?",
    "Are there any ingredients you particularly love or dislike?",
    "Do you have any favorite cooking techniques or styles?"
  ]
}
    `;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
