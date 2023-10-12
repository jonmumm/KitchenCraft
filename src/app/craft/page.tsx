:q
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
import { Header } from "../header";
import ClientProvider from "./client-provider";
import { QueryPreview } from "./components/query-preview";
import { SearchResults } from "./components/search-results";

const getSessionId = (cookies: string) => {
  return "";
};

const CreateSuggestionsInputSchema = z.object({
  prompt: z.string()
})

const ChatIdSchema = z.string().nonempty();

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const userId = undefined;
  const sessionId = await getSessionId("");

  const input = CreateSuggestionsInputSchema.parse(searchParams);



  // api.createSuggestions()


  return (
    <ClientProvider>
      <div className="flex flex-col gap-2 max-w-2xl mx-auto">
        <Header />
        <Card>
          <CardHeader>
            <CardTitle>Crafts</CardTitle>
            <CardDescription>
              Results for{" "}
              <span className="italics">
                [<QueryPreview />]
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchResults />
          </CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      </div>
    </ClientProvider>
  );
}

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   const recipe = await getRecipe(kv, params.slug);
//   const title = `${recipe.name} by @InspectorT | KitchenCraft.ai`;

//   const now = new Date(); // todo actually store this on the recipe
//   const formattedDate = new Intl.DateTimeFormat("en-US", {
//     dateStyle: "full",
//     timeStyle: "short",
//   }).format(now);
//   const dateStr = formattedDate.split(" at ").join(" @ ");

//   return {
//     title,
//     openGraph: {
//       title,
//       description: `${recipe.description} Crafted by @InspectorT on ${dateStr}`,
//     },
//   };
// }
