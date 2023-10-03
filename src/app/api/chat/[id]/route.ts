// ./app/api/chat/route.ts
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { kv } from "@vercel/kv";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const chatId = params.id; // Extracting chatId from the dynamic route parameter

  // Try to get messages from Redis first
  let messages = await kv.lrange(`chat:${chatId}:messages`, 0, -1);

  if (messages && messages.length > 0) {
    // Parse and return the messages directly if they exist
    const parsedMessages = messages.map((msg) => JSON.parse(msg));
    return new Response(JSON.stringify(parsedMessages), {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    // If messages do not exist in Redis, fetch them from OpenAI

    // Example messages. Replace with actual logic to generate messages.
    messages = [
      JSON.stringify({
        role: "user",
        content: "Your initial message content",
        timestamp: Date.now(),
      }),
      // ... other messages
    ];

    // Ask OpenAI for a streaming chat completion given the messages
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      messages: messages.map((msg) => JSON.parse(msg)), // make sure messages are in object format
    });

    // Save messages to Redis
    for (const message of messages) {
      await kv.lpush(`chat:${chatId}:messages`, message);
    }

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  }
}
