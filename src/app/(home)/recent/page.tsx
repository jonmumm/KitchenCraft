import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { getRecentRecipes } from "@/lib/db";
import { kv } from "@vercel/kv";
import { ArrowBigUpIcon } from "lucide-react";
import { map } from "nanostores";
import { Suspense } from "react";
// import {
//   RecipeDescription,
//   RecipeImage,
//   RecipeLink,
//   RecipeName,
// } from "../components";
import { RecipeStore } from "../types";

// export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const items = new Array(30).fill(0);

  const store: RecipeStore = map({
    loading: true,
    recipes: [],
  });

  getRecentRecipes(kv).then((recipes) => {
    store.set({
      error: undefined,
      loading: false,
      data: recipes,
    });
  });

  // const RecipeListItem = async ({ index }: { index: number }) => {
  //   const mediaItems = new Array(8).fill(0);

  //   return (
  //     <RecipeLink index={index} store={store}>
  //       <div className="w-full h-64 flex flex-row gap-4 relative">
  //         <Button
  //           className="absolute top-2 left-2 z-50"
  //           variant="outline"
  //           size="icon"
  //         >
  //           {index + 1}.
  //         </Button>
  //         {/* <Actions /> */}
  //         <div className="carousel carousel-center space-x-2 flex-1 px-4">
  //           {mediaItems.map((item, mediaIndex) => {
  //             return (
  //               <div key={mediaIndex} className="carousel-item">
  //                 <Suspense fallback={<Skeleton className="w-64" />}>
  //                   <RecipeImage
  //                     store={store}
  //                     index={index}
  //                     mediaIndex={mediaIndex}
  //                   />
  //                 </Suspense>
  //               </div>
  //             );
  //           })}
  //         </div>
  //       </div>
  //       <div className="px-5 flex flex-row gap-2 items-center">
  //         <div className="flex-1">
  //           <h2 className="font-semibold text-lg">
  //             <Suspense fallback={<Skeleton className="w-full h-7" />}>
  //               <RecipeName store={store} index={index} />
  //             </Suspense>
  //           </h2>
  //           <Suspense
  //             fallback={
  //               <div className="flex flex-col gap-2">
  //                 <Skeleton className="w-full h-8" />
  //                 <Skeleton className="w-full h-8" />
  //                 <Skeleton className="w-full h-8" />
  //               </div>
  //             }
  //           >
  //             <p>
  //               <RecipeDescription store={store} index={index} />
  //             </p>
  //           </Suspense>
  //         </div>
  //         <Button variant="outline">
  //           <ArrowBigUpIcon />
  //           <span>1</span>
  //         </Button>
  //       </div>
  //     </RecipeLink>
  //   );
  // };

  return (
    <div className="flex flex-col gap-8">
      {/* {items.map((_, index) => (
        <RecipeListItem key={index} index={index} />
      ))} */}
    </div>
  );
}
