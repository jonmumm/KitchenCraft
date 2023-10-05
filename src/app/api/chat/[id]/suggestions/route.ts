// ./app/api/chat/route.ts
import { assert } from "@/lib/utils";
import { MessageContentSchema, MessageSchema, RoleSchema } from "@/schema";
import {
  AssistantMessage,
  LLMMessageSet,
  Message,
  SystemMessage,
  UserMessage,
} from "@/types";
import { kv } from "@vercel/kv";
import { OpenAIStream, StreamingTextResponse, nanoid } from "ai";
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
  { params }: { params: { id: string } }
) {
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

  const chatId = params.id; // Extracting chatId from the dynamic route parameter

  const SYSTEM_CONTENT =
    "You will be provided with a description for a dish or set of dishes to create a recipe for. Your task is to return a list of up to 6 recipe names that are related to the description. Only come up with six if the recipes are sufficiently different from one another in technique or ingredients. Each name should be on it's own line in the format [Name]: [Description], where [Name] is substituted with the name of the dish and [Description] is substituted with a 12 word or less blurb. There should be no other surrounding text in your response.";
  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: "query",
    chatId,
    content: SYSTEM_CONTENT,
  } satisfies SystemMessage;

  const assistantMessage = {
    id: nanoid(),
    chatId,
    role: "assistant" as const,
    type: "query",
    state: "running",
  } satisfies AssistantMessage;

  const userMessage = {
    id: nanoid(),
    chatId,
    type: "query",
    ...userMessages[0],
  } satisfies UserMessage;

  // Store the messages from the user
  const newMessages: LLMMessageSet = [
    systemMessage,
    userMessage,
    assistantMessage,
  ];
  const assistantMessageId = assistantMessage.id;

  const multi = kv.multi();
  const promises = newMessages.map(async (message, index) => {
    const time = Date.now() + index / 1000;
    await multi.hset(`message:${message.id}`, message);
    return await multi.zadd(`chat:${message.chatId}:messages`, {
      score: time,
      member: message.id,
    });
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

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await kv.hset(`message:${assistantMessageId}`, {
        content: completion,
        state: "done",
      });
    },
  });

  return new StreamingTextResponse(stream);
}
