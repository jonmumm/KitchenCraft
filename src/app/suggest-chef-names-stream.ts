import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { z } from "zod";

export const SuggestChefNamesOutputSchema = z.object({
  names: z.array(z.string()),
});

export type SuggestChefNamesEvent = StreamObservableEvent<
  "SUGGEST_CHEF_NAMES",
  z.infer<typeof SuggestChefNamesOutputSchema>
>;

export class SuggestChefNamesStream extends TokenStream<{
  email: string;
  previousSuggestions: string[]; // Previous suggestions as an array
}> {
  protected async getUserMessage(input: {
    email: string;
    previousSuggestions: string[];
  }): Promise<string> {
    // Convert the array of previous suggestions into a readable string
    const previousSuggestionsText =
      input.previousSuggestions.length > 0
        ? "Previous Suggestions: " + input.previousSuggestions.join(", ")
        : "";
    return `Email: ${input.email}${
      previousSuggestionsText ? ", " + previousSuggestionsText : ""
    }`;
  }

  protected async getSystemMessage(input: {
    email: string;
    previousSuggestions: string[];
  }): Promise<string> {
    const previousSuggestionsText =
      input.previousSuggestions.length > 0
        ? "Considering the previous suggestions provided: " +
          input.previousSuggestions.join(", ") +
          "."
        : "";
    const TEMPLATE = `Generate six personalized nicknames suitable for use on a recipe app, based on the user's email address. ${previousSuggestionsText} The nicknames should incorporate elements of the email, use numbers, and underscores for readability, and reflect a variety of styles seen in usernames like 'sam_sizzle77', 'grill_king202', and 'spicy_chefTom'. For example, if the email is 'johnsmith@gmail.com', some suitable nicknames could be 'johnny_cooks', 'smith_bakeStar202', or 'chef_smith77'.

Format the response in YAML with a single key "names" and then the list of text strings to show as suggestion user names. Return nothing else but the formatted YAML. Return 6 suggestions`;
    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
