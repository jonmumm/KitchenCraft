// const RecipeImage = async <
//   T extends { previewMediaIds: string[] }[],
// >(props: {
//   store: MapStore<QueryStoreState<T>>;
//   index: number;
//   mediaIndex: number;
// }) => {
//   const mediaId = await waitForStoreValue(
//     props.store,
//     getMediaIdSelector(props.index, props.mediaIndex)
//   );

//   //   (state) => {
//   //   const recipe = state.data[props.index];
//   //   if (recipe?.previewMediaIds.length) {
//   //     return recipe.previewMediaIds[props.mediaIndex] || null;
//   //   }

//   //   if (!state.loading) return null;
//   // });

//   if (mediaId) {
//     const media = UploadedMediaSchema.parse(
//       await kv.hgetall(`media:${mediaId}`)
//     );

//     return (
//       <Image
//         className="w-72 aspect-square"
//         src={media.url}
//         // layoutId={`${media.id}-${index}`}
//         priority={props.index < 2 && props.mediaIndex == 0}
//         width={media.metadata.width}
//         height={media.metadata.width}
//         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//         alt="Main media"
//         style={{ objectFit: "cover" }}
//       />
//     );
//   } else {
//     return <Skeleton className="w-72 aspect-square" />;
//   }
// };
