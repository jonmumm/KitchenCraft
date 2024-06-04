import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { z } from "zod";

export const SuggestProfileNamesOutputSchema = z.object({
  names: z
    .array(
      z.string().describe("A URL-safe profile name suggestion for this user")
    )
    .describe("Should include exactly 6 names."),
});

const SUGGEST_PROFILE_NAME = "SUGGEST_PROFILE_NAME";

export type SuggestProfileNamesEvent = StreamObservableEvent<
  "SUGGEST_PROFILE_NAME",
  z.infer<typeof SuggestProfileNamesOutputSchema>
>;

export type SuggestProfileNamesOutput = z.infer<
  typeof SuggestProfileNamesOutputSchema
>;

export class SuggestProfileNamesStream extends StructuredObjectStream<
  {
    email: string;
    previousSuggestions: string[];
    preferences: Record<number, number>;
    personalizationContext: string;
  },
  SuggestProfileNamesOutput
> {
  protected getSchema(): z.ZodType<
    { names: string[] },
    z.ZodTypeDef,
    { names: string[] }
  > {
    return SuggestProfileNamesOutputSchema;
  }

  protected getName(): string {
    return SUGGEST_PROFILE_NAME;
  }

  protected async getUserMessage(input: {
    email: string;
    previousSuggestions: string[];
    preferences: Record<number, number>;
    personalizationContext: string;
  }): Promise<string> {
    const previousSuggestionsText =
      input.previousSuggestions.length > 0
        ? "Previous Suggestions: " + input.previousSuggestions.join(", ")
        : "";

    return `Email: ${input.email}${
      previousSuggestionsText ? ", " + previousSuggestionsText : ""
    }, ${
      input.personalizationContext
        ? `Extra Info: ${input.personalizationContext}`
        : ``
    }
    `;
  }

  protected async getSystemMessage(input: {
    email: string;
    previousSuggestions: string[];
    preferences: Record<number, number>;
    personalizationContext: string;
  }): Promise<string> {
    const previousSuggestionsText =
      input.previousSuggestions.length > 0
        ? " and considering the previous suggestions provided: " +
          input.previousSuggestions.join(", ") +
          "."
        : "";

    const TEMPLATE = `Generate six personalized nicknames suitable for a recipe app profile, based on the user's email address${previousSuggestionsText}. The nicknames should incorporate elements of the email (ignoring the domain), use random numbers, and you can use underscores for readability. Reflect a variety of styles seen in usernames like [Adjective][Noun] (e.g., BakingJohn), [Flavor/Ingredient][Descriptor] (e.g., VanillaTony), [Region/City][Chef/Cook] (e.g., denver_cook_smith, TokyoChef) or another style. Aim for a mix of camelcase (70% of the time) and full lower case with underscores (30% of the time).`;

    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
