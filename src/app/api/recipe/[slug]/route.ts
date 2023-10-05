// ./app/api/chat/route.ts
import { getRecipe } from "@/lib/db";
import { assert } from "@/lib/utils";
import { AssistantMessage, Message, UserMessage } from "@/types";
import { kv } from "@vercel/kv";
import { OpenAIStream, StreamingTextResponse, nanoid } from "ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  // todo add rate limit check to make sure we dont already have a query in flight...

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
  const { chatId } = await getRecipe(kv, params.slug);

  const SYSTEM_CONTENT =
    "You will be given the name and description of a recipe, and the prompt that was used to create a list of recipes that this particular name and description was selected from. Your task is to give me the full recipe, with ingredients, cooking and prep times broken out, ingredients measurements, tips for preparation, and anything else that might be helpful to a home cook for this particular recipe.";
  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: "recipe",
    chatId,
    content: SYSTEM_CONTENT,
  } satisfies Message;
  const assistantMessage = {
    id: nanoid(),
    chatId,
    role: "assistant" as const,
    type: "recipe",
    state: "running",
  } satisfies Omit<AssistantMessage, "content">;

  const userMessage = {
    id: nanoid(),
    chatId,
    type: "recipe",
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
  await multi.hset(`recipe:${slug}`, {
    messageSet,
  });
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
          content: completion,
          state: "done",
        });
      },
      async onFinal(completion) {
        console.log("FINAL!!!!!");
      },
      // async onFinal(completion) {
      //   await kv.hdel(`message:${messageId}`);
      // },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    // todo likely a cancellation from chatgpt... try cleaning up...
    console.error(error, content);
    // todo how do i handle this stream
    // if (error instanceof OpenAI.APIError) {
    //   const { name, status, headers, message } = error;
    //   return NextResponse.json({ name, status, headers, message }, { status });
    // } else {
    //   throw error;
    // }
  }
}
