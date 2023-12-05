import { getSession } from "@/lib/auth/session";
import { RecipeListItem } from "../recipe/components";
import { getHotRecipes } from "./queries";

// export const dynamic = "force-dynamic";
export default async function Page() {
  const items = new Array(30).fill(0);
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = await getHotRecipes(session?.user.id);

  return (
    <div className="flex flex-col gap-12">
      {items.map((_, index) => {
        const recipe = recipes[index];

        if (!recipe) {
          return null;
        }

        return (
          <RecipeListItem
            key={index}
            index={index}
            recipe={recipe}
            userId={userId}
          />
        );
      })}
    </div>
  );
}

// const RecipeCarousel = async ({ slug }: { slug: string }) => {
//   const items = new Array(10).fill(0);

//   const Loader = async () => {
//     return (
//       <>
//         {items.map((_, index) => {
//           const width = Math.random() < 0.5 ? 44 : 64;
//           return (
//             <div className="carousel-item h-64" key={index}>
//               <Skeleton className={`w-${width} h-64`} />
//             </div>
//           );
//         })}
//       </>
//     );
//   };

//   const Content = async () => {
//     const mediaList = await getSortedMediaForRecipe(slug);

//     return (
//       <>
//         {items.map((_, index) => {
//           const media = mediaList[index];
//           if (!media) {
//             const width = Math.random() < 0.5 ? 44 : 64;
//             return (
//               <div className="carousel-item" key={index}>
//                 <Skeleton animation="none" className={`w-${width} h-64`} />
//               </div>
//             );
//           }

//           return (
//             <div className="carousel-item h-64" key={index}>
//               <Image
//                 className="rounded-box h-64 w-auto"
//                 src={media.url}
//                 priority={index === 0}
//                 width={media.width}
//                 height={media.height}
//                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                 alt="Main media"
//                 // placeholder="empty"
//                 // style={{ objectFit: "cover" }}
//               />
//             </div>
//           );
//         })}
//       </>
//     );
//   };

//   return (
//     <div className="carousel carousel-center overflow-y-hidden space-x-2 flex-1 p-4 bg-slate-900">
//       <Suspense fallback={<Loader />}>
//         <Content />
//       </Suspense>
//     </div>
//   );
// };
