import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/navigation/tabs";
import { ChevronRightIcon, TimerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { Header } from "../header";
// import {
//   RecipeDescription,
//   RecipeLink,
//   RecipeName,
//   RecipeTimestamp,
// } from "./components";
import { Badge } from "@/components/display/badge";
import { getSession } from "@/lib/auth/session";
import { formatDuration, timeAgo } from "@/lib/utils";
import {
  getProfileByUserId,
  getRecentRecipesByUser,
  getSortedMediaForMultipleRecipes,
} from "../../db/queries";
import { BestDropdown } from "./components.client";
import LayoutClient, { HomeTabs } from "./layout.client";

export default async function Layout({ children }: { children: ReactNode }) {
  const userId = (await getSession())?.user.id;
  let username: string | undefined;
  if (userId) {
    const result = await getProfileByUserId(userId);
    username = result?.profileSlug;
  }

  async function upvote(slug: string) {
    "use server";
    console.log("upvote", slug);
  }

  return (
    <LayoutClient>
      <div className="max-w-2xl mx-auto">
        <Header />
      </div>
      <div className="flex flex-col gap-3">
        {userId && (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex flex-row justify-between items-end px-4 pb-1 w-full max-w-2xl mx-auto">
              <Label className="uppercase font-semibold text-accent-foreground opacity-70 text-xs">
                {username}&apos;s Crafts
              </Label>
              <Link href={`/@${username}`}>
                <Badge variant="outline">View All ⇨</Badge>
              </Link>
            </div>
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
    const slugs = recipes.map((recipe) => recipe.slug);
    const mediaBySlug = slugs.length
      ? await getSortedMediaForMultipleRecipes(slugs)
      : {};

    return (
      <>
        {items.map((_, index) => {
          const recipe = recipes[index];
          if (!recipe) {
            return <Skeleton key={index} className="w-64 h-36 carousel-item" />;
          }
          const media = mediaBySlug[recipe.slug]?.[0];

          return (
            <div key={index} className="carousel-item w-64 h-36">
              <Link key={recipe.slug} href={`/recipe/${recipe.slug}`}>
                <Card className="w-64 h-36 bg-secondary flex flex-col gap-1 justify-between py-2">
                  <div className="flex flex-row gap-2 px-3 items-start">
                    <h3 className="text-lg font-semibold flex-1">
                      {recipe.name}
                    </h3>
                    {!media ? (
                      <Button size="icon" variant="outline">
                        <ChevronRightIcon />
                      </Button>
                    ) : (
                      <>
                        <Image
                          priority={index === 0}
                          className="w-16 aspect-square rounded-sm"
                          // layoutId={`${item.id}-${index}`}
                          sizes="(max-width: 768px) 20vw, (max-width: 1200px) 15vw, 10vw"
                          src={media.url}
                          width={media.width}
                          height={media.height}
                          alt={recipe.name}
                          style={{ objectFit: "cover" }}
                        />
                      </>
                    )}
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground leading-5 px-3">
                    {recipe.description}
                  </div>
                  <div className="flex flex-row justify-between px-3 items-end">
                    <div className="text-xs text-muted-foreground flex flex-row gap-1">
                      <TimerIcon size={14} />
                      <span>{formatDuration(recipe.totalTime)}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {timeAgo(recipe.createdAt.toISOString())}
                    </div>
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
