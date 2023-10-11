import RecipeCard from "@/components/recipe-card";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { kv } from "@vercel/kv";
import { LightbulbIcon } from "lucide-react";
import { Metadata } from "next";
import { z } from "zod";
import { Header } from "../../header";
import { IdeasContent } from "./components/ideas-content";
import { IdeasHeader } from "./components/ideas-header";
import { IdeasList } from "./components/ideas-list";
import { TipsContent } from "./components/tips-content";
import { TipsList } from "./components/tips-list";
import { RecipePageProvider } from "./context";
import Provider from "./provider";
import { RemixContent, RemixHeader, RemixInput } from "./remix-chat-card";

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

  console.log({ recipeMessages });

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
            <Card id="remix" className="mx-3">
              <form className="flex flex-col items-center">
                <RemixHeader />
                <Separator />
                <RemixContent>
                  <RemixInput />
                </RemixContent>
              </form>
            </Card>
            <Card className="mx-3">
              <div className="flex fex-row gap-2 items-center justify-between w-full p-4">
                <Label className="font-semibold uppercase text-xs">Tips</Label>
                <LightbulbIcon />
              </div>
              <Separator />
              <TipsContent>
                <TipsList slug={recipe.slug} />
              </TipsContent>
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
