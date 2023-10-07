import { RecipeChat } from "@/components/recipe-chat";
import RecipeViewer from "@/components/recipe-viewer";
import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { kv } from "@vercel/kv";
import { z } from "zod";
import Head from "next/head";
import Provider from "./provider";
import { Metadata, ResolvingMetadata } from "next";
import { Props } from "next/script";

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

  const recipe = await getRecipe(kv, params.slug);
  const messages = recipe.messageSet
    ? await getLLMMessageSet(kv, recipe.messageSet)
    : [];
  const title = `${recipe.name} | KitchenCraft.ai`;

  return (
    <>
      <Provider
        chatId={chatId}
        userId={userId}
        recipe={recipe}
        sessionId={sessionId}
        recipeMessages={messages}
      >
        <div className="flex flex-col flex-end flex-1 justify-end overflow-hidden">
          {/* <Header /> */}
          <RecipeViewer />
          <RecipeChat />
        </div>
      </Provider>
    </>
  );
}

type Props = {
  params: { slug: string };
};

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
