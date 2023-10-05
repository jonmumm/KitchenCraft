import { RecipeChat } from "@/components/recipe-chat";
import RecipeViewer from "@/components/recipe-viewer";
import { MessageIdSchema, MessageSchema } from "@/schema";
import { kv } from "@vercel/kv";
import { z } from "zod";
import Header from "./header";
import Provider from "./provider";

const getSessionId = (cookies: string) => {
  return "";
};

const ChatIdSchema = z.string().nonempty();

export default async function Page({ params }: { params: { slug: string } }) {
  const userId = undefined;
  const sessionId = await getSessionId("");

  const chatId = ChatIdSchema.parse(
    await kv.hget(`recipe:${params.slug}`, "chatId")
  );

  const messageIds = z
    .array(MessageIdSchema)
    .parse(await kv.zrange(`recipe:${chatId}:messages`, 0, -1));

  const initialMessages = await Promise.all(
    messageIds.map(async (messageId) => {
      const data = await kv.hgetall(`recipe:${params.slug}:messages`);
      return MessageSchema.parse(data);
    })
  );

  return (
    <Provider
      chatId={chatId}
      userId={userId}
      sessionId={sessionId}
      slug={params.slug}
    >
      <div className="flex flex-col flex-end flex-1 justify-end pt-16 overflow-hidden">
        <Header />
        <RecipeViewer initialMessages={initialMessages} />
        <RecipeChat />
      </div>
    </Provider>
  );
}
