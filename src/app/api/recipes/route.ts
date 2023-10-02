import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [
      {
        content:
          "You will be provided with a description for a dish or set of dishes to create a recipe for. Your task is to return a list of up to 6 recipe names that are related to the description. Only come up with six if the recipes are sufficiently different from one another in technique or ingredients. Each name should be on it's own line in the format [Name]: [Description], where [Name] is substituted with the name of the dish and [Description] is substituted with a 12 word or less blurb. There should be no other surrounding text in your response.",
        role: "system",
      },
      ...messages,
    ],
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    onStart: async () => {
      // This callback is called when the stream starts
      // You can use this to save the prompt to your database
      // await savePromptToDatabase(prompt);
    },
    onToken: async (token: string) => {
      // This callback is called for each token in the stream
      // You can use this to debug the stream or save the tokens to your database
      // console.log(token);
    },
    onCompletion: async (completion: string) => {
      // This callback is called when the stream completes
      // You can use this to save the final completion to your database
      // await saveCompletionToDatabase(completion);
    },
  });
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
