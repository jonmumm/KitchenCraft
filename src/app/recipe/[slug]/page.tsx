import RecipeCard from "@/components/recipe-card";
import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { kv } from "@vercel/kv";
import { Metadata } from "next";
import { z } from "zod";
import { Header } from "../../header";
import Provider from "./provider";
import { Suspense } from "react";
import { RemixChatCard } from "./remix-chat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

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
  const recipeMessages = recipe.messageSet
    ? await getLLMMessageSet(kv, recipe.messageSet)
    : [];

  return (
    <Provider
      chatId={chatId}
      userId={userId}
      recipe={recipe}
      sessionId={sessionId}
      recipeMessages={recipeMessages}
    >
      <div className="flex flex-col gap-3 pb-16 max-w-2xl m-auto">
        <Header />

        <RecipeCard />
        <RemixChatCard />
      </div>
    </Provider>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await getRecipe(kv, params.slug);
  const title = `${recipe.name} by @InspectorT | KitchenCraft.ai`;

  const now = new Date(); // todo actually store this on the recipe
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);
  const dateStr = formattedDate.split(" at ").join(" @ ");

  return {
    title,
    openGraph: {
      title,
      description: `${recipe.description} Crafted by @InspectorT on ${dateStr}`,
    },
  };
}
