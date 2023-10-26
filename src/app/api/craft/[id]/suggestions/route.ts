import { RECIPE_TIPS_SYSTEM_PROMPT } from "@/app/prompts";
import { getLLMMessageSet, getMessage, getRecipe } from "@/lib/db";
import { assert, pollWithExponentialBackoff } from "@/lib/utils";
import { AssistantMessage, LLMMessageSet, Message, UserMessage } from "@/types";
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
  const messageType = "tips";

  if (recipe.tipsMessageSet) {
    const [_, _1, tipsAssistantMessage] = await getLLMMessageSet(
      kv,
      recipe.tipsMessageSet
    );

    if (tipsAssistantMessage.content) {
      return new Response(tipsAssistantMessage.content);
    }
  }

  let recipeMessagesSet: LLMMessageSet | undefined;
  if (recipe.messageSet) {
    recipeMessagesSet = await getLLMMessageSet(kv, recipe.messageSet);
  } else {
    await pollWithExponentialBackoff(async () => {
      const recipe = await getRecipe(kv, slug);
      if (recipe.messageSet) {
        recipeMessagesSet = await getLLMMessageSet(kv, recipe.messageSet);
        return true;
      }
      return false;
    });
  }
  assert(recipeMessagesSet, "expected recipeMessageSet");

  const [_, recipeUserMesage, recipeAssistantMessage] = recipeMessagesSet;

  let recipeContent: string | undefined = undefined;
  if (recipeAssistantMessage.state === "done") {
    recipeContent = recipeAssistantMessage.content;
  } else {
    // content only exists if in "done" state
    await pollWithExponentialBackoff(async () => {
      // refetch the queryAssistantMessage from the source and check its state
      const message = (await getMessage(
        kv,
        recipeAssistantMessage.id
      )) as AssistantMessage;
      console.log(message.id, message.state, message.content);

      if (message.state === "done") {
        recipeContent = message.content;
        return true;
      }
      return false;
    });
  }
  assert(recipeContent, "expected recipe to exist on message");

  assert(recipeAssistantMessage.content, "expected recipe to exist on message");

  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: messageType,
    chatId: recipe.chatId,
    content: RECIPE_TIPS_SYSTEM_PROMPT,
  } satisfies Message;
  const assistantMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    role: "assistant" as const,
    type: messageType,
    state: "running",
  } satisfies Omit<AssistantMessage, "content">;

  // Grab the content off the first message in the form body
  const userMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    type: messageType,
    role: "user",
    // queryUserMessage should be the name anddescription
    // queryAssistantMessage should be the recipe yaml
    content: recipeUserMesage.content + ": " + recipeUserMesage.content,
  } satisfies UserMessage;

  const newMessages = [systemMessage, userMessage, assistantMessage] as const;
  const tipsMessageSet = newMessages.map(({ id }) => id);
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
    tipsMessageSet,
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
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    return NextResponse.json({ error }, { status: 503 });
  }
}
