// ./app/api/chat/route.ts
import { MessageContentSchema, MessageSchema, RoleSchema } from "@/schema";
import { AssistantMessage, Message } from "@/types";
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

  const chatId = params.id; // Extracting chatId from the dynamic route parameter

  const SYSTEM_CONTENT =
    "You will be provided with a description for a dish or set of dishes to create a recipe for. Your task is to return a list of up to 6 recipe names that are related to the description. Only come up with six if the recipes are sufficiently different from one another in technique or ingredients. Each name should be on it's own line in the format [Name]: [Description], where [Name] is substituted with the name of the dish and [Description] is substituted with a 12 word or less blurb. There should be no other surrounding text in your response.";
  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: "query",
    chatId,
    content: SYSTEM_CONTENT,
  } satisfies Message;
  const assistantMessage = {
    id: nanoid(),
    chatId,
    role: "assistant" as const,
    type: "query",
    state: "running",
  } satisfies Omit<AssistantMessage, "content">;

  // Store the messages from the user
  const newMessages = [
    systemMessage,
    ...userMessages.map((message) => ({
      id: nanoid(),
      type: "query",
      chatId,
      ...message,
    })),
    assistantMessage,
  ];
  const assistantMessageId = newMessages[newMessages.length - 1].id;

  const multi = kv.multi();
  const promises = newMessages.map(async (message) => {
    await multi.hset(`message:${message.id}`, message);
    const time = Date.now();
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
    // async onFinal(completion) {
    //   await kv.hdel(`message:${messageId}`);
    // },
  });

  return new StreamingTextResponse(stream);

  // Transform the response into a readable stream
  // const isSuggesting = await kv.hget(`message:${messageId}`, "suggesting");
  // if (isSuggesting) {
  //   // todo duplicate concurrent requests more gracefully
  //   return new Response(JSON.stringify({ error: "duplicate request" }), {
  //     status: 409,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }
  // await kv.hset(`message:${messageId}`, { suggesting: true });

  // const stream = OpenAIStream(response, {
  //   async onCompletion(completion) {
  //     const timestamp = Date.now();
  //     const id = nanoid();
  //     const message = {
  //       id,
  //       role: "assistant",
  //       type: "query",
  //       content: completion,
  //       chatId,
  //     } satisfies Message;

  //     const multi = kv.multi();
  //     await multi.hset(`message:${id}`, message);
  //     await multi.zadd(`chat:${chatId}:messages`, {
  //       score: timestamp,
  //       member: id,
  //     });
  //     await multi.exec();
  //   },
  //   async onFinal(completion) {
  //     await kv.hdel(`message:${messageId}`, "suggesting");
  //   },
  // });

  // // Return a StreamingTextResponse, which can be consumed by the client
  // return new StreamingTextResponse(stream);

  // return new Response(
  //   JSON.stringify({
  //     success: true,
  //   }),
  //   {
  //     headers: { "Content-Type": "application/json" },
  //   }
  // );

  // if (messageIds.length === 0) {
  //   return new Response(
  //     JSON.stringify({
  //       error: `Not able to find messageIds for chatId: ${chatId}`,
  //     }),
  //     {
  //       status: 404,
  //       headers: { "Content-Type": "application/json" },
  //     }
  //   );
  // }

  // todo page this
  // console.log({ messageIds });
  // const messages = await Promise.all(
  //   messageIds.map(async (messageId) => {
  //     const result = await kv.hgetall(`message:${messageId}`);
  //     console.log({ result });

  //     return MessageSchema.parse(result);
  //   })
  // );

  // Walk backward through all the messages looking for the
  // first message that doesn't have a 'assistant' message following it
  // ... meaning the LLM hasn't responded yet to the query
  // let unansweredQueryMessage: Message | undefined;
  // let lastQueryResponse: Message | undefined;
  // for (let i = messages.length - 1; i >= 0; i--) {
  //   const message = messages[i];
  //   if (message.type !== "query") {
  //     continue;
  //   }

  //   if (message.role === "assistant") {
  //     lastQueryResponse = message;
  //   } else if (!lastQueryResponse && message.role === "user") {
  //     unansweredQueryMessage = message;
  //   }

  //   if (unansweredQueryMessage) {
  //     break;
  //   }
  // }

  // console.log({ unansweredQueryMessage, lastQueryResponse });

  // If we have a query we haven't answered yet,
  // send it through the LLM and stream back the result
  // if (unansweredQueryMessage) {
  //   const messageId = unansweredQueryMessage.id;

  //   const response = await openai.chat.completions.create({
  //     model: "gpt-4",
  //     stream: true,
  //     messages: [
  //       {
  //         content: SYSTEM_CONTENT,
  //         role: "system",
  //       },
  //       {
  //         content: unansweredQueryMessage.content,
  //         role: "user",
  //       },
  //     ],
  //   });

  //   // Transform the response into a readable stream
  //   const isSuggesting = await kv.hget(`message:${messageId}`, "suggesting");
  //   if (isSuggesting) {
  //     // todo duplicate concurrent requests more gracefully
  //     return new Response(JSON.stringify({ error: "duplicate request" }), {
  //       status: 409,
  //       headers: { "Content-Type": "application/json" },
  //     });
  //   }
  //   await kv.hset(`message:${messageId}`, { suggesting: true });

  //   const stream = OpenAIStream(response, {
  //     async onCompletion(completion) {
  //       const timestamp = Date.now();
  //       const id = nanoid();
  //       const message = {
  //         id,
  //         role: "assistant",
  //         type: "query",
  //         content: completion,
  //         chatId,
  //       } satisfies Message;

  //       const multi = kv.multi();
  //       await multi.hset(`message:${id}`, message);
  //       await multi.zadd(`chat:${chatId}:messages`, {
  //         score: timestamp,
  //         member: id,
  //       });
  //       await multi.exec();
  //     },
  //     async onFinal(completion) {
  //       await kv.hdel(`message:${messageId}`, "suggesting");
  //     },
  //   });

  //   // Return a StreamingTextResponse, which can be consumed by the client
  //   return new StreamingTextResponse(stream);
  // } else if (lastQueryResponse) {
  //   // If we have a query, and have the response, send
  //   return new Response(lastQueryResponse.content);
  // }

  // return new Response(JSON.stringify({ success: true }), {
  //   headers: { "Content-Type": "application/json" },
  // });

  // Find the query by looking for the most recent message with
  // a query type set
  // let query: string | undefined;
  // while (index >= 0) {
  //   const messageId = messageIds[index];
  //   const result = await kv.hget(`message:${messageId}`, "content");

  //   const { id, chatId, content, role, type } = MessageSchema.parse(result);

  //   if (type === "query") {
  //     query = content;
  //     break;
  //   }

  //   index = index - 1;
  // }

  // if (query) {
  // return new Response(JSON.stringify({ success: true }), {
  //   headers: { "Content-Type": "application/json" },
  // });
  // }

  // if (messages && messages.length > 0) {
  //   // Parse and return the messages directly if they exist
  //   const parsedMessages = messages.map((msg) => JSON.parse(msg));
  //   return new Response(JSON.stringify(parsedMessages), {
  //     headers: { "Content-Type": "application/json" },
  //   });
  // } else {
  //   // If messages do not exist in Redis, fetch them from OpenAI

  //   // Example messages. Replace with actual logic to generate messages.
  //   messages = [
  //     JSON.stringify({
  //       role: "user",
  //       content: "Your initial message content",
  //       timestamp: Date.now(),
  //     }),
  //     // ... other messages
  //   ];

  //   // Ask OpenAI for a streaming chat completion given the messages
  //   const response = await openai.chat.completions.create({
  //     model: "gpt-4",
  //     stream: true,
  //     messages: messages.map((msg) => JSON.parse(msg)), // make sure messages are in object format
  //   });

  //   // Save messages to Redis
  //   for (const message of messages) {
  //     await kv.lpush(`chat:${chatId}:messages`, message);
  //   }

  //   // Convert the response into a friendly text-stream
  //   const stream = OpenAIStream(response);
  //   // Respond with the stream
  //   return new StreamingTextResponse(stream);
  // }
}
