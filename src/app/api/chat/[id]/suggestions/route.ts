// ./app/api/chat/route.ts
import { SlugSchema } from "@/schema";
import { LangChainStream } from "ai";
// import "event-source-polyfill";
import EventSource from "@sanity/eventsource";
import { CallbackManager } from "langchain/callbacks";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";
import { z } from "zod";
import { YamlStructuredOutputParser } from "./parser";

const replicate = new Replicate();

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

const SearchParamsSchema = z.object({
  prompt: z.string(),
  remixedFrom: SlugSchema.optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { prompt } = SearchParamsSchema.parse(
    Object.fromEntries(new URL(req.url).searchParams)
  );

  const { handlers } = LangChainStream({
    onStart() {
      console.log("start");
    },
    onCompletion(token) {
      console.log("complettion", { token });
    },
    onToken(token) {
      console.log({ token });
    },
  });
  const parser = new YamlStructuredOutputParser(ResultSchema, examples);

  const chatPrompt = PromptTemplate.fromTemplate(`
You will be provided with a prompt that may include ingredients, dish names, cooking techniques, or other things related to a recipe
for Your task is to return a list of up to 6 recipe names that are related to the prompt.
Come up with six recipes that are sufficiently different from one another in technique or ingredients but within the constraints of the input.

Format: {format_instructions}

Input: {prompt}`);

  const prediction = await replicate.predictions.create({
    stream: true,
    version: "6527b83e01e41412db37de5110a8670e3701ee95872697481a355e05ce12af0e",
    input: {
      prompt: await chatPrompt.format({
        prompt,
        format_instructions: parser.getFormatInstructions(),
      }),
    },
  });

  if (prediction && prediction.urls && prediction.urls.stream) {
    const Authorization = `Bearer ${process.env.REPLICATE_API_TOKEN}`;
    const source = new EventSource(prediction.urls.stream, {
      withCredentials: false,
      headers: {
        Authorization,
      },
    });

    const charArray: string[] = [];

    source.addEventListener("open", (e) => {
      console.log("open");
    });
    source.addEventListener("output", (e) => {
      for (const char of e.data) {
        charArray.push(char);
      }
      // console.log(charArray.join(""));
    });

    source.addEventListener("error", (e) => {
      console.error("error", e);
    });

    source.addEventListener("done", (e) => {
      console.log("DONE!", charArray.join(""));
      source.close();
    });
  }

  return NextResponse.json({ success: true });
}

const examples = [
  {
    name: "Zesty Lemon Herb Chicken",
    description:
      "Juicy chicken marinated in lemon, garlic, and fresh herbs. Perfect grilled.",
  },
  {
    name: "Sweet Potato Coconut Curry",
    description:
      "Creamy coconut milk, aromatic spices, and roasted sweet potatoes. Vegan delight.",
  },
  {
    name: "Chia Berry Parfaif",
    description:
      "Layered fresh berries, yogurt, and chia seed pudding. Healthy breakfast treat.",
  },
];

const ResultSchema = z.array(
  z.object({
    name: z.string().describe("name of the recipe"),
    description: z
      .string()
      .describe("a 12 word or less blurb describing the recipe"),
  })
);
