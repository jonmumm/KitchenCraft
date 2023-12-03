// import { Separator } from "@/components/display/separator";
// import { Skeleton } from "@/components/display/skeleton";
// import { Button } from "@/components/input/button";
// import {
//   ArrowBigUpDashIcon,
//   CameraIcon,
//   PlusSquareIcon,
//   PrinterIcon,
//   ScrollIcon,
//   ShareIcon,
//   ShoppingBasketIcon,
//   ShuffleIcon,
// } from "lucide-react";
// import { MapStore } from "nanostores";
// import Link from "next/link";
// import { Suspense } from "react";
// import { AddButton } from "./add-button";
// import { CraftingDetails } from "./crafting-details";
// // import { IngredientList } from "./ingredient-list";
// // import { InstructionList } from "./instruction-list";
// import { PrintButton } from "./print-button";
// import { StoreProps } from "./schema";
// import { ShareButton } from "./share-button";
// // import { Tags } from "./tags";
// // import { Times } from "./times";
// import { UploadMediaButton } from "./upload-media-button";
// // import { UpvoteButton } from "./upvote-button";
// import { Yield } from "./yield";

// export const RecipeContents = async ({
//   name,
//   description,
//   createdAt,
//   store,
// }: {
//   name: string;
//   description: string;
//   createdAt?: string;
//   store: MapStore<StoreProps>;
// }) => {
//   // const mainMediaId = previewMediaIds[0];

//   // let mainMedia: UploadedMedia | undefined;
//   // if (mainMediaId) {
//   //   console.log({ mainMediaId });
//   //   mainMedia = UploadedMediaSchema.parse(
//   //     await kv.hgetall(`media:${mainMediaId}`)
//   //   );
//   // }
//   // console.log({ mainMedia });

//   return (
//     <>
//       <div className="flex flex-row gap-3 p-5 justify-between">
//         <div className="flex flex-col gap-2">
//           <h1 className="text-2xl font-semibold">{name}</h1>
//           <p className="text-lg text-muted-foreground">{description}</p>
//           <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
//             <span>Yields</span>
//             <span>
//               <Suspense fallback={<Skeleton className="w-24 h-5" />}>
//                 <Yield store={store} />
//               </Suspense>
//             </span>
//           </div>
//           {/* <div className="flex flex-row gap-2">
//             <Skeleton className="w-20 h-20 animate-none" />
//             <Skeleton className="w-20 h-20 animate-none" />
//             <Skeleton className="w-20 h-20 animate-none" />
//             <span className="sr-only">Upload Photo</span>
//           </div> */}
//         </div>

//         <div className="flex flex-col gap-1 hidden-print">
//           <AddButton>
//             <PlusSquareIcon />
//           </AddButton>
//           <UploadMediaButton slug={store.get().recipe.slug}>
//             <CameraIcon />
//           </UploadMediaButton>
//           <PrintButton>
//             <PrinterIcon />
//           </PrintButton>
//           <ShareButton>
//             <ShareIcon />
//           </ShareButton>
//           {/* <UpvoteButton>
//             <ArrowBigUpDashIcon />
//             <span className="font-bold">1</span>
//           </UpvoteButton> */}
//           <Button variant="outline" aria-label="Remix">
//             <Link href={`#remix`}>
//               <ShuffleIcon />
//             </Link>
//           </Button>
//         </div>
//       </div>
//       <Separator />
//       <div className="flex flex-row gap-2 p-2 justify-center hidden-print">
//         <div className="flex flex-col gap-2 items-center">
//           <CraftingDetails createdAt={createdAt || Date.now().toString()} />
//         </div>
//       </div>
//       {/* <MediaRow previewMediaIds={previewMediaIds} /> */}
//       <Separator className="hidden-print" />
//       <Times store={store} />
//       <Separator />
//       <Tags store={store} />
//       <Separator />

//       <div className="px-5">
//         <div className="flex flex-row justify-between gap-1 items-center py-4">
//           <h3 className="uppercase text-xs font-bold text-accent-foreground">
//             Ingredients
//           </h3>
//           <ShoppingBasketIcon />
//         </div>
//         <div className="mb-4 flex flex-col gap-2">
//           <Suspense fallback={<Skeleton className="w-full h-20" />}>
//             <ul className="list-disc pl-5">
//               <IngredientList store={store} />
//             </ul>
//           </Suspense>
//         </div>
//       </div>
//       <Separator />

//       <div className="px-5">
//         <div className="flex flex-row justify-between gap-1 items-center py-4">
//           <h3 className="uppercase text-xs font-bold text-accent-foreground">
//             Instructions
//           </h3>
//           <ScrollIcon />
//         </div>
//         <div className="mb-4 flex flex-col gap-2">
//           <Suspense fallback={<Skeleton className="w-full h-20" />}>
//             <ol className="list-decimal pl-5">
//               <InstructionList store={store} />
//             </ol>
//           </Suspense>
//         </div>
//       </div>
//     </>
//   );
// };
