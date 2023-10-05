import { RecipeChat } from "@/components/recipe-chat";
import RecipeViewer from "@/components/recipe-viewer";
import { getLLMMessageSet, getRecipe } from "@/lib/db";
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

  const { name, slug, description, messageSet } = await getRecipe(
    kv,
    params.slug
  );
  const messages = messageSet ? await getLLMMessageSet(kv, messageSet) : [];

  return (
    <Provider
      chatId={chatId}
      userId={userId}
      sessionId={sessionId}
      slug={slug}
      name={name}
      description={description}
      recipeMessages={messages}
    >
      <div className="flex flex-col flex-end flex-1 justify-end pt-16 overflow-hidden">
        <Header />
        <RecipeViewer />
        <RecipeChat />
      </div>
    </Provider>
  );
}
