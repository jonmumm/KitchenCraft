import { CraftInput } from "@/app/craft/components/craft-input";
import { Header } from "@/app/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getErrorMessage } from "@/lib/error";
import { waitForStoreValue } from "@/lib/utils";
import {
  PromptSchema,
  RecipeSchema,
  RemixIdeasPredictionInputSchema,
} from "@/schema";
import { kv } from "@vercel/kv";
import {
  ChevronRightIcon,
  LightbulbIcon,
  MessageSquareDashedIcon,
  ShuffleIcon,
} from "lucide-react";
import { map } from "nanostores";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { z } from "zod";
import RemixIdeasGenerator from "./remix-ideas-generator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import RouterLink from "@/components/router-link";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string>;
};

const RemixInputSchema = z.object({
  prompt: PromptSchema.optional(),
  id: z.string().optional(),
});
type RemixInput = z.infer<typeof RemixInputSchema>;

export default async function RemixCard({ slug }: { slug: string }) {
  const recipeKey = `recipe:${slug}`;
  const recipe = RecipeSchema.parse(await kv.hgetall(recipeKey));

  const handleSubmitForm = async (data: FormData) => {
    "use server";
    console.log("handle submit!");
    // const parsed = PromptSchema.safeParse(data.get("prompt"));
    // if (parsed.success) {
    //   await conjureAction(parsed.data);
    // }
  };

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto px-4">
      <Card>
        <Command shouldFilter={false}>
          <CardHeader className="items-start">
            <div className="flex flex-row gap-3 items-center">
              <ShuffleIcon />
              <div className="flex flex-col gap-1">
                <CardDescription>
                  Remixing <span className="font-semibold">{recipe.name}</span>
                </CardDescription>
              </div>
            </div>
            {/* {action?.actionType === "remix" && (
                <div>
                  <Link href={`/recipe/${action.remixSrc}`}>
                    <Badge
                      variant="outline"
                      className="flex flex-row gap-2 items-center px-4 py-2"
                    >
                      <ShuffleIcon className="mr-1" size={24} />
                      <div className="flex flex-row gap-1 text-xs items-center">
                        <span>Remixed from</span>
                        <span className="font-semibold underline underline-offset-4">
                          <Suspense fallback={<RecipeNameLoader />}>
                            <RecipeName slug={action.remixSrc} />
                          </Suspense>
                        </span>
                      </div>
                      <ChevronRightIcon className="-mr-1" />
                    </Badge>
                  </Link>
                </div>
              )} */}
          </CardHeader>
          <CardContent className="round-md p-0">
            <div className="w-full">
              <form action={handleSubmitForm}>
                {/* <CraftInput
                  // onValueChange={changeAction}
                  defaultValue={prompt}
                /> */}
              </form>
            </div>
            <CommandList className="p-3 max-h-100">
              <CommandGroup heading="Ideas">
                <RemixIdeas slug={slug} />
              </CommandGroup>
              {/* {remixSrc && resultType === "remix" && (
                  <Suspense fallback={<RemixResultsLoader />}>
                    <RemixResults srcSlug={remixSrc} prompt={prompt} />
                  </Suspense>
                )} */}
              {/* <RecentPrompts /> */}
              {/* {resultType === "suggestions" && <RecipeSuggestions />} */}
              {/* <ConjureAction /> */}
            </CommandList>
          </CardContent>
        </Command>
      </Card>
    </div>
  );
}

export const RemixIdeas = async ({ slug }: { slug: string }) => {
  const recipe = RemixIdeasPredictionInputSchema.shape.recipe.parse(
    await kv.hgetall(`recipe:${slug}`)
  );

  const store = map({
    loading: true,
    error: undefined as string | undefined,
    ideas: [] as string[],
  });

  const waitForIdea = (index: number) =>
    waitForStoreValue(store, (state) => {
      const doneLoading = state.ideas[index + 1] || !state.loading;
      if (doneLoading) {
        return state.ideas[index];
      }
    });

  const RemixIdeaItem = async ({ index }: { index: number }) => {
    const idea = await waitForIdea(index);

    if (!idea) {
      return <></>;
    }

    const [p1, p2] = idea.split(":");
    return (
      <div className="flex flex-col gap-1 items-start">
        <h4 className="font-semibold text-xs">{p1}</h4>
        <p className="text-xs">{p2}</p>
      </div>
    );
  };

  const RemixIdeaLink = async ({
    index,
    children,
  }: {
    index: number;
    children: ReactNode;
  }) => {
    const idea = await waitForIdea(index);

    return (
      <Link
        key={index}
        className="flex flex-row gap-3 items-center justify-between w-full p-3"
        href={`/recipe/${slug}/remix?prompt=${idea}`}
        shallow={true}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      <Suspense fallback={null}>
        <RemixIdeasGenerator
          input={{ recipe }}
          onProgress={(output) => {
            const ideas = output.ideas;
            if (ideas) {
              store.setKey("ideas", ideas);
            }
          }}
          onError={(error) => {
            store.setKey("error", getErrorMessage(error));
          }}
          onComplete={(output) => {
            store.setKey("ideas", output.ideas);
            store.setKey("loading", false);
          }}
        />
      </Suspense>
      {new Array(6).fill(0).map((_, index) => {
        const children = (
          <>
            <LightbulbIcon />
            <span className="flex-1">
              <span className="italic">
                <Suspense fallback={<Skeleton className="w-20, h-5" />}>
                  <RemixIdeaItem index={index} />
                </Suspense>
              </span>
            </span>
          </>
        );

        return (
          <Suspense key={index} fallback={<>{children}</>}>
            <RemixIdeaLink index={index}>{children}</RemixIdeaLink>
          </Suspense>
        );
      })}
    </>
  );
};
