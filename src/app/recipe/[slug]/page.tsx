import { RecipeChat } from "@/components/recipe-chat";
import { kv } from "@vercel/kv";
import Header from "./header";
import Provider from "./provider";
import { z } from "zod";

const getSessionId = (cookies: string) => {
  return "";
};

const ChatIdSchema = z.string().nonempty();

export default async function Page({ params }: { params: { slug: string } }) {
  const userId = undefined;
  const sessionId = await getSessionId("");

  const data = await kv.hget(`recipe:${params.slug}`, "chatId");
  const chatId = ChatIdSchema.parse(data);

  return (
    <Provider
      chatId={chatId}
      userId={userId}
      sessionId={sessionId}
      slug={params.slug}
    >
      <div className="flex flex-col flex-end flex-1 justify-end pt-16 overflow-hidden">
        <Header />
        <RecipeChat />
      </div>
    </Provider>
  );
}
