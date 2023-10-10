import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { assert } from "@/lib/utils";
import { RecipeViewerDataSchema } from "@/schema";
import { AssistantMessage, Message, UserMessage } from "@/types";
import { kv } from "@vercel/kv";
import { OpenAIStream, StreamingTextResponse, nanoid } from "ai";
import * as yaml from "js-yaml";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const json = await req.json();
  const { messages: userMessages } = z
    .object({
      messages: z.array(
        z.object({
          role: z.literal("user"),
          content: z.string().nonempty(),
        })
      ),
    })
    .parse(json);
  assert(userMessages.length === 1, "only single messages currently supported");
  const recipe = await getRecipe(kv, params.slug);

  const [_, queryUserMessage, queryAssistantMessage] = await getLLMMessageSet(
    kv,
    recipe.queryMessageSet
  );

  const SYSTEM_CONTENT = `
    You will be given a recipe and a description of how it should be modified.
    Your task is to repeat the changes to the recipe in plain descriptive language.
    This text will be used in a confirmation dialog presented to the user.
    Include no text other than the description of the changes.
`;

  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: "remix",
    chatId: recipe.chatId,
    content: SYSTEM_CONTENT,
  } satisfies Message;
  const assistantMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    role: "assistant" as const,
    type: "remix",
    state: "running",
  } satisfies Omit<AssistantMessage, "content">;

  // Grab the content off the first message in the form body
  const userMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    type: "remix",
    ...userMessages[0],
  } satisfies UserMessage;

  const newMessages = [systemMessage, userMessage, assistantMessage] as const;
  const messageSet = newMessages.map(({ id }) => id);
  const assistantMessageId = assistantMessage.id;

  const multi = kv.multi();
  const promises = newMessages.map(async (message, index) => {
    const time = Date.now();
    await multi.hset(`message:${message.id}`, message);
    return await multi.zadd(`chat:${message.chatId}:messages`, {
      score: time + index / 100,
      member: message.id,
    });
  });
  // await multi.hset(`recipe:${slug}`, {
  //   remixMessageSet,
  // });
  await Promise.all(promises);
  await multi.exec();

  const messages = [systemMessage, ...userMessages].map(
    ({ role, content }) => ({ role, content })
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages,
  });

  let content = "";
  try {
    const stream = OpenAIStream(response, {
      async onToken(token) {
        content = content + token;
      },
      async onCompletion(completion) {
        await kv.hset(`message:${assistantMessageId}`, {
          content: JSON.stringify(completion),
          state: "done",
        });

        try {
          const json = yaml.load(completion);
          const data = RecipeViewerDataSchema.parse(json);
          await kv.hset(`recipe:${slug}`, data);
          await kv.zadd(`recipes:new`, {
            score: Date.now(),
            member: slug,
          });
        } catch (ex) {
          console.error("Error parsing yaml completion", ex);
        }
      },
      async onFinal(completion) {
        console.log("FINAL!");
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    return NextResponse.json({ error }, { status: 503 });
  }
}
