import RecipeCard from "@/components/recipe-card";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { kv } from "@vercel/kv";
import { Metadata } from "next";
import { z } from "zod";
import { Header } from "../../header";
import { RecipePageProvider } from "./context";
import Provider from "./provider";
import { RemixContent, RemixHeader, RemixInput } from "./remix-chat-card";
import { IdeasContent } from "./components/ideas-content";
import { IdeasList } from "./components/ideas-list";
import { IdeasHeader } from "./components/ideas-header";

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
    <RecipePageProvider slug={params.slug}>
      <Provider
        chatId={chatId}
        userId={userId}
        recipe={recipe}
        sessionId={sessionId}
        recipeMessages={recipeMessages}
      >
        <div className="flex flex-col pb-16 max-w-2xl m-auto">
          <Header />

          <div className="flex flex-col gap-2">
            <RecipeCard />
            <Card className="mx-3">
              <form className="flex flex-col items-center">
                <RemixHeader />
                <Separator />
                <RemixContent>
                  <RemixInput />
                </RemixContent>
              </form>
            </Card>
            <Card className="mx-3">
              <form className="flex flex-col items-center">
                <IdeasHeader />
                <Separator />
                <IdeasContent>
                  <IdeasList slug={recipe.slug} />
                </IdeasContent>
              </form>
            </Card>
          </div>
        </div>
      </Provider>
    </RecipePageProvider>
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
