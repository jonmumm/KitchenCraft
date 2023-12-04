import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/navigation/tabs";
import { getMyRecentRecipes } from "@/lib/db";
import { kv } from "@vercel/kv";
import { ChevronRightIcon } from "lucide-react";
import { map } from "nanostores";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { Header } from "../header";
// import {
//   RecipeDescription,
//   RecipeLink,
//   RecipeName,
//   RecipeTimestamp,
// } from "./components";
import { BestDropdown } from "./components.client";
import LayoutClient, { HomeTabs } from "./layout.client";
import { RecipeStore } from "./types";
import { getRecentRecipesByUser } from "./queries";
import { getSession } from "@/lib/auth/session";
import { timeAgo } from "@/lib/utils";

export default async function Layout({ children }: { children: ReactNode }) {
  const userId = (await getSession())?.user.id;

  async function upvote(slug: string) {
    "use server";
    console.log("upvote", slug);
  }

  return (
    <LayoutClient>
      <div>
        <Header />
      </div>
      <div className="flex flex-col gap-3">
        {userId && (
          <div className="flex flex-col gap-1 w-full">
            <Label className="px-4 uppercase font-semibold text-accent-foreground opacity-70 text-xs">
              InspectorT&apos;s Crafts
            </Label>
            <MyRecipes userId={userId} />
          </div>
        )}
        <HomeTabs>
          <TabsList className="w-full">
            <TabsTrigger value="hot" asChild>
              <Link href="/">Hot</Link>
            </TabsTrigger>
            <TabsTrigger value="recent" asChild>
              <Link href="/recent">Recent</Link>
            </TabsTrigger>
            <TabsTrigger value="best" asChild>
              <Link href="/best" className="flex flex-row gap-2">
                <span>Best</span>
                <BestDropdown />
              </Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hot">{children}</TabsContent>
          <TabsContent value="recent">{children}</TabsContent>
          <TabsContent value="best">{children}</TabsContent>
        </HomeTabs>
      </div>
    </LayoutClient>
  );
}

const MyRecipes = ({ userId }: { userId: string }) => {
  const items = new Array(30).fill(0);
  const Loader = () => {
    return (
      <>
        {items.map((_, index) => {
          return <Skeleton key={index} className="w-64 h-36 carousel-item" />;
        })}
      </>
    );
  };

  const Content = async () => {
    const recipes = await getRecentRecipesByUser(userId);

    return (
      <>
        {items.map((_, index) => {
          const recipe = recipes[index];
          if (!recipe) {
            return <Skeleton key={index} className="w-64 h-36 carousel-item" />;
          }

          return (
            <div key={index} className="carousel-item w-64 h-36">
              <Link key={recipe.slug} href={`/recipe/${recipe.slug}`}>
                <Card className="w-64 h-36 bg-secondary flex flex-col gap-1 justify-between py-2">
                  <div className="flex flex-row gap-1 px-3 items-center">
                    <h3 className="text-lg font-semibold flex-1">
                      {recipe.name}
                    </h3>
                    <Button size="icon" variant="outline">
                      <ChevronRightIcon />
                    </Button>
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground leading-5 px-3">
                    {recipe.description}
                  </div>
                  <div className="text-xs text-muted-foreground px-3">
                    {timeAgo(recipe.createdAt.toISOString())}
                  </div>
                </Card>
              </Link>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="carousel carousel-center space-x-2 px-4">
      <Suspense fallback={<Loader />}>
        <Content />
      </Suspense>
    </div>
  );
};

// const MyReceiptRecipes = ({}) => {
//   const recipes = await getRecentRecipesByUser(userId)
//   // const recipes = await getMyRecentRecipes(kv);
//   // const store: RecipeStore = map({
//   //   loading: true,
//   //   recipes: [],
//   // });

//   // getMyRecentRecipes(kv).then((recipes) => {
//   //   store.set({
//   //     error: undefined,
//   //     loading: false,
//   //     data: recipes,
//   //   });
//   // });

//   // getMyRecentRecipes(kv).then((recipes) => {
//   //   console.log({ recipes });
//   // });

//   // getRecentRecipes(kv).then((recipes) => {
//   //   store.set({
//   //     loading: false,
//   //     recipes,
//   //   });
//   // });

//   // getMyRecentRecipes(kv).then((recipes) => {
//   //   store.set({
//   //     loading: false,
//   //     recipes,
//   //   });
//   // });

//   const items = new Array(6).fill(0);

//   return (
//     <>
//       {items.map((_, index) => {
//         return (
//           <div key={index} className="carousel-item">
//             <Suspense fallback={<Skeleton className="w-64 h-36" />}>
//               <RecipeLink index={index} store={store}>
//                 <Card className="w-64 h-36 bg-secondary flex flex-col gap-1 justify-between py-2">
//                   <div className="flex flex-row gap-1 px-3 items-center">
//                     <h3 className="text-lg font-semibold flex-1">
//                       <RecipeName store={store} index={index} />
//                     </h3>
//                     <Button size="icon" variant="outline">
//                       <ChevronRightIcon />
//                     </Button>
//                   </div>
//                   <div className="line-clamp-2 text-xs text-muted-foreground leading-5 px-3">
//                     <RecipeDescription store={store} index={index} />
//                   </div>
//                   <div className="text-xs text-muted-foreground px-3">
//                     <RecipeTimestamp store={store} index={index} />
//                   </div>
//                 </Card>
//               </RecipeLink>
//             </Suspense>
//           </div>
//         );
//       })}
//     </>
//   );
// };