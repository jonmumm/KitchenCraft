import { RecipeChat } from "@/components/recipe-chat";
import RecipeViewer from "@/components/recipe-viewer";
import { Header } from "../../header";
import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { kv } from "@vercel/kv";
import { Metadata, ResolvingMetadata } from "next";
import { z } from "zod";
import Provider from "./provider";
const getSessionId = (cookies: string) => {
  return "";
};

const ChatIdSchema = z.string().nonempty();

type Props = {
  params: { slug: string };
};

export default async function Page({ params }: Props) {
  const userId = undefined;
  const sessionId = await getSessionId("");

  const chatId = ChatIdSchema.parse(
    await kv.hget(`recipe:${params.slug}`, "chatId")
  );

  const recipe = await getRecipe(kv, params.slug);
  const messages = recipe.messageSet
    ? await getLLMMessageSet(kv, recipe.messageSet)
    : [];

  return (
    <>
      <Provider
        chatId={chatId}
        userId={userId}
        recipe={recipe}
        sessionId={sessionId}
        recipeMessages={messages}
      >
        <Header />
        <div className="flex flex-col flex-end flex-1 justify-end overflow-hidden">
          <RecipeViewer />
          <RecipeChat />
        </div>
      </Provider>
    </>
  );
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const recipe = await getRecipe(kv, params.slug);
  const title = `${recipe.name} | KitchenCraft.ai`;

  return {
    title,
    openGraph: {
      title,
      description: recipe.description,
    },
  };
}
