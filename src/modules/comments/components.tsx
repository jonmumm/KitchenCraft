import { getDistinctId } from "@/lib/auth/session";
import { ReactNode } from "react";
import { postComment } from "./actions";
import { CommentsRoot } from "./components.client";
import { getCommentsForRecipeSlug } from "./queries";

export const CommentsProvider = async ({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) => {
  const comments = await getCommentsForRecipeSlug(slug);
  const distinctId = await getDistinctId();

  return (
    <CommentsRoot
      slug={slug}
      initialComments={comments}
      postComment={postComment.bind(null, slug).bind(null, distinctId)}
    >
      {children}
    </CommentsRoot>
  );
};
