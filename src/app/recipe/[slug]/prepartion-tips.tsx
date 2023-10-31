import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getErrorMessage } from "@/lib/error";
import { waitForStoreValue } from "@/lib/utils";
import { TipsPredictionInputSchema } from "@/schema";
import { kv } from "@vercel/kv";
import { LightbulbIcon } from "lucide-react";
import { Suspense } from "react";
import PreparationTipsGenerator from "./preparation-tips-generator";
import { map } from "nanostores";

export const PreparationTips = async ({ slug }: { slug: string }) => {
  const recipe = TipsPredictionInputSchema.shape.recipe.parse(
    await kv.hgetall(`recipe:${slug}`)
  );

  const store = map({
    loading: true,
    error: undefined as string | undefined,
    items: [] as string[],
  });

  const waitForIdea = (index: number) =>
    waitForStoreValue(store, (state) => {
      const doneLoading = state.items[index + 1] || !state.loading;
      if (doneLoading) {
        return state.items[index] || null;
      }
    });

  const Item = async ({ index }: { index: number }) => {
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

  return (
    <>
      <Suspense fallback={null}>
        <PreparationTipsGenerator
          input={{ recipe }}
          onProgress={(output) => {
            const items = output.tips;
            if (items) {
              store.setKey("items", items);
            }
          }}
          onError={(error) => {
            store.setKey("error", getErrorMessage(error));
          }}
          onComplete={(output) => {
            store.setKey("items", output.tips);
            store.setKey("loading", false);
          }}
        />
      </Suspense>
      {new Array(4).fill(0).map((_, index) => {
        const children = (
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

        return (
          <Suspense key={index} fallback={<>{children}</>}>
            <Link
              className="flex flex-row gap-3 items-center justify-between w-full p-3"
              href="/"
              // href={`/recipe/${slug}/remix?prompt=${idea}`}
            >
              {children}
            </Link>
          </Suspense>
        );
      })}
    </>
  );
};
