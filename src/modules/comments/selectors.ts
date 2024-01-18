import { createSelector } from "reselect";
import { Context } from "./machine";

export const selectContext = (
  props: unknown & {
    context: Context;
  }
) => props.context;

export const selectNewComment = createSelector(
  selectContext,
  (ctx) => ctx.newComment
);

export const selectHasInput = createSelector(
  selectNewComment,
  (comment) => !!comment?.length
);

// export const selectHasInput = createSelector(
//   selectContext,
//   (context) => !!context.newComment?.length
// );

export const selectComments = createSelector(
  selectContext,
  (context) => context.comments
);

export const selectHasComments = createSelector(
  selectComments,
  (comments) => !!comments?.length
);

export const createSelectCommentAtIndex = (index: number) =>
  createSelector(selectComments, (comments) => comments[index]);
