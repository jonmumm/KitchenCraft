import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { assert } from "@/lib/utils";
import { AssistantMessage, Message, UserMessage } from "@/types";
import { kv } from "@vercel/kv";
import { OpenAIStream, StreamingTextResponse, nanoid } from "ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const recipe = await getRecipe(kv, params.slug);

  const [_, _1, queryAssistantMessage] = await getLLMMessageSet(
    kv,
    recipe.queryMessageSet
  );
  assert(queryAssistantMessage.content, "expected recipe to exist on message");

  const SYSTEM_CONTENT = `
    You will be given a recipe. Give back a list of ten ways the recipe can be modified. Consider possible variations in ingredients, cookware (e.g. instant pot vs grill vs wok), technique, or timing.
`;

  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: "modifications",
    chatId: recipe.chatId,
    content: SYSTEM_CONTENT,
  } satisfies Message;
  const assistantMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    role: "assistant" as const,
    type: "modifications",
    state: "running",
  } satisfies Omit<AssistantMessage, "content">;

  // Grab the content off the first message in the form body
  const userMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    type: "modifications",
    role: "user",
    content: queryAssistantMessage.content,
  } satisfies UserMessage;

  const newMessages = [systemMessage, userMessage, assistantMessage] as const;
  const modificationsMessageSet = newMessages.map(({ id }) => id);
  const assistantMessageId = assistantMessage.id;

  // todo set the message ref ids on the recipe
  // so we can refetch the message data later...

  const multi = kv.multi();
  const promises = newMessages.map(async (message, index) => {
    // const time = Date.now();
    return await multi.hset(`message:${message.id}`, message);
    // return await multi.zadd(`chat:${message.chatId}:messages`, {
    //   score: time + index / 100,
    //   member: message.id,
    // });
  });
  await multi.hset(`recipe:${slug}`, {
    modificationsMessageSet,
  });
  await Promise.all(promises);
  await multi.exec();

  const messages = [systemMessage, userMessage].map(({ role, content }) => ({
    role,
    content,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages,
  });

  try {
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        await kv.hset(`message:${assistantMessageId}`, {
          content: JSON.stringify(completion),
          state: "done",
        });

        // todo save these modification suggestions in to the recipe...

        // try {
        //   const json = yaml.load(completion);
        //   const data = RecipeViewerDataSchema.parse(json);
        //   await kv.hset(`recipe:${slug}`, data);
        //   await kv.zadd(`recipes:new`, {
        //     score: Date.now(),
        //     member: slug,
        //   });
        // } catch (ex) {
        //   console.error("Error parsing yaml completion", ex);
        // }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    return NextResponse.json({ error }, { status: 503 });
  }
}
