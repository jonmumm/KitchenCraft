import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/error";
import { waitForStoreValue } from "@/lib/utils";
import { RemixIdeasPredictionInputSchema } from "@/schema";
import { kv } from "@vercel/kv";
import { ArrowUpFromLineIcon, LightbulbIcon, Link } from "lucide-react";
import { map } from "nanostores";
import { ReactNode, Suspense } from "react";
import RemixIdeasGenerator from "./remix/remix-ideas-generator";
import { Button } from "@/components/ui/button";

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
    console.log({ idea });

    if (!idea) {
      return <></>;
    }

    const [p1, p2] = idea.split(":");
    return (
      <div className="flex flex-col gap-1 items-start">
        <h4 className="font-semibold text-sm">{p1}</h4>
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
            console.log(output.ideas);
            store.setKey("loading", false);
          }}
        />
      </Suspense>
      {new Array(6).fill(0).map((_, index) => {
        // const content = (
        //   <>
        //     <LightbulbIcon />
        //     <span className="flex-1">
        //       <span className="italic">
        //         <Suspense fallback={<Skeleton className="w-20, h-5" />}>
        //           <RemixIdeaItem index={index} />
        //         </Suspense>
        //       </span>
        //     </span>
        //   </>
        // );

        return (
          <Button
            variant="ghost"
            key={index}
            size="fit"
            className="flex flex-row gap-3 items-center justify-between w-full p-3"
            // href={`/recipe/${slug}/remix?prompt=${idea}`}
          >
            <span className="flex-1">
              <span className="italic">
                <Suspense fallback={<Skeleton className="w-20, h-5" />}>
                  <RemixIdeaItem index={index} />
                </Suspense>
              </span>
            </span>
            <ArrowUpFromLineIcon />
          </Button>
        );
      })}
    </>
  );
};
