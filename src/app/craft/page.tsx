import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { getLLMMessageSet, getRecipe } from "@/lib/db";
import getQueryClient from "@/lib/getQueryClient";
import { SlugSchema } from "@/schema";
import { kv } from "@vercel/kv";
import { nanoid } from "ai";
import { ChevronRightIcon, ShuffleIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Header } from "../header";
import ClientProvider from "./client-provider";
// import { Chat } from "./components/chat";
import { pollWithExponentialBackoff } from "@/lib/utils";
import { ConjureAction } from "./components/conjure-action";
import { CraftInput } from "./components/craft-input";
import SuggestionResult from "./components/suggestion-result";
import { Reload } from "./reload";
import Image from "next/image";

export const dynamic = "force-dynamic";

const PromptSchema = z.string();

const ConjureCraftInputSchema = z.object({
  prompt: PromptSchema,
  actionType: z.literal("conjure"),
});
type ConjureCraftInput = z.infer<typeof ConjureCraftInputSchema>;

const RemixCraftInputSchema = z.object({
  prompt: PromptSchema,
  actionType: z.literal("remix"),
  remixSrc: SlugSchema,
});

const StartOverActionSchema = z.object({
  actionType: z.literal("startOver"),
});

const CraftInputSchema = z.object({
  prompt: PromptSchema.optional(),
  id: z.string().optional(),
});
type CraftInput = z.infer<typeof CraftInputSchema>;

const CraftActionInputSchema = z.discriminatedUnion("actionType", [
  ConjureCraftInputSchema,
  RemixCraftInputSchema,
  StartOverActionSchema,
]);
type CraftAction = z.infer<typeof CraftActionInputSchema>;

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const { prompt, id } = CraftInputSchema.parse(searchParams);

  const conjureAction = async (prompt: string) => {
    "use server";
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("prompt", prompt);
    const url = `/craft/suggestions?${nextParams.toString()}`;
    redirect(url);
  };

  const handleSubmitForm = async (data: FormData) => {
    "use server";
    const parsed = PromptSchema.safeParse(data.get("prompt"));
    if (parsed.success) {
      await conjureAction(parsed.data);
    }
  };

  return (
    <ClientProvider>
      <div className="flex flex-col gap-2 max-w-2xl mx-auto px-4">
        <Header hidden={true} />
        <Card>
          <Command shouldFilter={false}>
            <CardHeader className="items-start">
              <div className="flex flex-row gap-3 items-center">
                <Image
                  className="w-12 aspect-square"
                  src="/apple-touch-icon.png"
                  alt="KitchenCraft Logo"
                  width={44}
                  height={44}
                />
                <div className="flex flex-col gap-1">
                  <CardDescription>
                    Enter ingredients, cooking techniques, descriptions.
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
                  <CraftInput
                    // onValueChange={changeAction}
                    defaultValue={prompt}
                  />
                </form>
              </div>
              <CommandList className="p-3 max-h-100">
                {/* {remixSrc && resultType === "remix" && (
                  <Suspense fallback={<RemixResultsLoader />}>
                    <RemixResults srcSlug={remixSrc} prompt={prompt} />
                  </Suspense>
                )} */}
                {/* <RecentPrompts /> */}
                {/* {resultType === "suggestions" && <RecipeSuggestions />} */}
                <ConjureAction action={conjureAction} />
              </CommandList>
            </CardContent>
          </Command>
        </Card>
      </div>
    </ClientProvider>
  );
}

// async function RemixResults(props: { srcSlug: string; prompt: string }) {
//   const recipe = await getRecipe(kv, props.srcSlug);
//   // await new Promise((resolve) => setTimeout(resolve, 3000));

//   // If the recipe isnt there yet, just bail... but shouldnt ever happen
//   if (!recipe.messageSet) {
//     console.warn("unexpected recipe.messageSet not found in RemixResults");
//     return null;
//   }

//   const [_, recipeUserMessage, recipeAssistantMessage] = await getLLMMessageSet(
//     kv,
//     recipe.messageSet
//   );
//   if (!recipeAssistantMessage.content) {
//     return null;
//   }

//   // if we are already running this query, bail...

//   // await new Promise((resolve) => setTimeout(resolve, 3000));
//   return (
//     <CommandGroup heading="Remix">
//       <CommandItem>{recipeAssistantMessage.content}</CommandItem>
//     </CommandGroup>
//   );
// }

function RemixResultsLoader() {
  return (
    <CommandGroup heading="Remix">
      <CommandItem>
        <Skeleton className="w-full h-24" />;
      </CommandItem>
    </CommandGroup>
  );
}

function RecentPrompts() {
  return (
    <CommandGroup heading="Recent Prompts">
      <CommandItem>feta, egg, pizza</CommandItem>
      <CommandItem>delicata squash, garlic, cheese</CommandItem>
    </CommandGroup>
  );
}

async function RecipeSuggestions() {
  return (
    <CommandGroup heading="Suggestions">
      <CommandItem>
        <SuggestionResult
          name="Chewy Buttermilk Pancakes"
          description="Rich, creamy buttermilk pancaked topped with blueberries
                        and a peanut butter drizzle."
        />
      </CommandItem>
      <CommandItem>
        <SuggestionResult
          name="Tapioca Flour Pancakes"
          description="Rich, creamy buttermilk pancaked topped with blueberries
                        and a peanut butter drizzle."
        />
      </CommandItem>
    </CommandGroup>
  );
}

const ConjureResultsChat = async ({ chainId }: { chainId: string }) => {
  const items = [1, 2, 3, 4, 5, 6];
  // which items exist in the results?

  return (
    <div className="flex flex-col gap-1">
      <Suspense fallback={null}>
        <ReloadChainWhileRunning chainId={chainId} />
      </Suspense>
      {items.map((item, index) => {
        return (
          <Suspense fallback={<SuggestionLoading />} key={index}>
            <Suggestion chainId={chainId} index={index} key={item} />
          </Suspense>
        );
      })}
    </div>
  );
};

const ChainRunStatusSchema = z
  .enum(["initialized", "running", "error", "done"])
  .nullable();

const ChainSchema = z.object({
  runStatus: ChainRunStatusSchema,
});

// const ChainOutputSchema = z.record(z.any());

const ReloadChainWhileRunning = async ({ chainId }: { chainId: string }) => {
  let stillRunning = true;
  await pollWithExponentialBackoff(async () => {
    const chainRunStatus = ChainRunStatusSchema.parse(
      await kv.hget(`chain:${chainId}`, "runStatus")
    );
    console.log({ chainRunStatus });

    if (chainRunStatus === "running") {
      return false;
    }

    stillRunning = false;
    return true;
  });
  console.log({ stillRunning });

  if (!stillRunning) {
    return null;
  }

  const reload = async (chainId: string) => {
    "use server";
    console.log("hi", "reload", chainId);
  };
  const binded = reload.bind(undefined, chainId);

  return <Reload reloadIfMore={binded} />;
};

const SuggestionDataSchema = z.object({
  name: z.string(),
  description: z.string(),
});
type SuggestionData = z.infer<typeof SuggestionDataSchema>;

const Suggestion = async ({
  chainId,
  index,
}: {
  chainId: string;
  index: number;
}) => {
  let suggestion: Partial<SuggestionData> | undefined;
  // Fetch the query

  await pollWithExponentialBackoff(async () => {
    const data = kv.hgetall(`chain:${chainId}:output:suggestions:${index}`);
    const parse = SuggestionDataSchema.partial().safeParse(data);

    if (parse.success) {
      suggestion = parse.data;
      return true;
    }
    return false;
  }, 10000);

  if (!suggestion) {
    return (
      <Card className="h-20">
        <Skeleton className="w-20 h-6" />
      </Card>
    );
  }

  return (
    <Link href={"/"}>
      <Card className="h-20">
        {suggestion.name} {suggestion.description}
      </Card>
    </Link>
  );
};

const SuggestionLoading = () => {
  return <Skeleton className="w-full h-20" />;
};

const ChatLoading = () => {
  return <Skeleton className="w-full h-20" />;
};

const createChain = async ({
  type,
  prompt,
}: {
  type: "conjure";
  prompt: string;
}) => {
  const id = nanoid();
  const runStatus = "initialized";
  await kv.hset(`chain:${id}`, { runStatus });

  return {
    id,
    runStatus: "initialized",
  };
};

const createChat = async ({ type }: { type: "conjure" }) => {
  const id = nanoid();

  await kv.hset(`chat:${id}`, {
    type,
    createdAt: Date.now(),
  });

  // todo actually kick off the prompt here...

  return {
    id,
    type,
  };
};

const pollWhileChainRunning = async (chainId: string) =>
  await pollWithExponentialBackoff(async () => {
    const chainRunStatus = ChainRunStatusSchema.parse(
      await kv.hget(`chain:${chainId}`, "runStatus")
    );

    if (chainRunStatus === "running") {
      return false;
    }

    return true;
  });
