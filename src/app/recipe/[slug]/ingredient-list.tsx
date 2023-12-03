// import { Skeleton } from "@/components/display/skeleton";
// import { waitForStoreValue } from "@/lib/utils";
// import { MapStore } from "nanostores";
// import { Suspense } from "react";
// import { StoreProps } from "./schema";

// export const IngredientList = async ({
//   store,
// }: {
//   store: MapStore<StoreProps>;
// }) => {
//   await waitForStoreValue(store, (state) => state.recipe.ingredients?.length);
//   const MAX_NUM_LINES = 30;
//   const NUM_LINE_PLACEHOLDERS = 5;
//   const items = new Array(MAX_NUM_LINES).fill(0);

//   const Token = async ({
//     index,
//     itemIndex,
//   }: {
//     index: number;
//     itemIndex: number;
//   }) => {
//     const token = await waitForStoreValue(store, (state) => {
//       // todo add is loading logic here...
//       const { ingredients, instructions } = state.recipe;
//       if (!ingredients) {
//         return;
//       }

//       const tokens = ingredients[itemIndex]?.split(" ");
//       const token = tokens[index];
//       const nextTokenExists = !!tokens[index + 1];
//       const nextItemExists = !!ingredients[itemIndex + 1];
//       const nextSectionExists = instructions?.length;

//       const doneLoading =
//         nextSectionExists ||
//         nextItemExists ||
//         nextTokenExists ||
//         !state.loading;
//       if (doneLoading) {
//         return token ? token : null;
//       }
//     });

//     return token ? <>{token} </> : null;
//   };

//   const Item = async ({ index }: { index: number }) => {
//     const renderItem = await waitForStoreValue(store, ({ recipe, loading }) => {
//       if (recipe.ingredients && recipe.ingredients[index]) {
//         return true;
//       }

//       if (recipe.instructions || !loading) {
//         return false;
//       }
//     });
//     const MAX_NUM_TOKENS_PER_ROW = 40;
//     const NUM_PLACEHOLDERS_TOKENS = 5;
//     const tokens = new Array(MAX_NUM_TOKENS_PER_ROW).fill(0);

//     return renderItem ? (
//       <li>
//         <span className="flex flex-row gap-1 flex-wrap">
//           {tokens.map((_, tokenIndex) => {
//             return (
//               <Suspense
//                 fallback={
//                   tokenIndex < NUM_PLACEHOLDERS_TOKENS ? (
//                     <Skeleton className="w-6 h-4" />
//                   ) : null
//                 }
//                 key={tokenIndex}
//               >
//                 <Token index={tokenIndex} itemIndex={index} />
//               </Suspense>
//             );
//           })}
//         </span>
//       </li>
//     ) : null;
//   };

//   return (
//     <>
//       {items.map((_, index) => {
//         return (
//           <Suspense
//             key={index}
//             fallback={
//               index < NUM_LINE_PLACEHOLDERS ? (
//                 <Skeleton className="w-full h-5" />
//               ) : null
//             }
//           >
//             <Item index={index} />
//           </Suspense>
//         );
//       })}
//     </>
//   );
// };
