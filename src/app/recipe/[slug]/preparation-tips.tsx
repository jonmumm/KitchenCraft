import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/error";
import { waitForStoreValue } from "@/lib/utils";
import { TipsPredictionInputSchema } from "@/schema";
import { kv } from "@vercel/kv";
import { LightbulbIcon, Link } from "lucide-react";
import { map } from "nanostores";
import { ReactNode, Suspense } from "react";
import PreparationTipsGenerator from "./preparation-tips-generator";
import { Button } from "@/components/ui/button";

export const PrepartionTips = async ({ slug }: { slug: string }) => {
  const recipe = TipsPredictionInputSchema.shape.recipe.parse(
    await kv.hgetall(`recipe:${slug}`)
  );

  const store = map({
    loading: true,
    error: undefined as string | undefined,
    items: [] as string[],
  });

  const waitForItem = (index: number) =>
    waitForStoreValue(store, (state) => {
      const doneLoading = state.items[index + 1] || !state.loading;
      if (doneLoading) {
        return state.items[index];
      }
    });

  const Item = async ({ index }: { index: number }) => {
    const idea = await waitForItem(index);
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
    const idea = await waitForItem(index);

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
        <PreparationTipsGenerator
          input={{ recipe }}
          onProgress={(output) => {
            const tips = output.tips;
            if (tips) {
              store.setKey("items", tips);
            }
          }}
          onError={(error) => {
            store.setKey("error", getErrorMessage(error));
          }}
          onComplete={(output) => {
            console.log(output.tips);
            store.setKey("items", output.tips);
            store.setKey("loading", false);
          }}
        />
      </Suspense>
      {new Array(6).fill(0).map((_, index) => {
        return (
          <>
            <LightbulbIcon />
            <span className="flex-1">
              <span className="italic">
                <Suspense fallback={<Skeleton className="w-20, h-5" />}>
                  <Item index={index} />
                </Suspense>
              </span>
            </span>
          </>
        );
      })}
    </>
  );
};
