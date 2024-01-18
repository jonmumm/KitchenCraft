"use client";

import { RobotAvatarImage } from "@/components/display/avatar";
import { useActor } from "@/hooks/useActor";
import { useSelector } from "@/hooks/useSelector";
import { Profile, RecipeComment } from "@/types";
import { Avatar } from "@radix-ui/react-avatar";
import { ReactNode, createContext, useCallback, useContext } from "react";
import { Actions } from "./actions";
import {
  RecipeCommentsActor,
  RecipeCommentsSnapshot,
  createRecipeCommentsMachine,
} from "./machine";
import { selectComments, selectHasComments } from "./selectors";

const RecipeCommentsContext = createContext({} as RecipeCommentsActor);

export const CommentsRoot = ({
  children,
  slug,
  postComment,
  initialComments,
}: {
  children: ReactNode;
  slug: string;
  postComment: Actions["postComment"];
  initialComments: {
    id: RecipeComment["id"];
    comment: RecipeComment["comment"];
    mediaIds: string[] | null;
    authorSlug: Profile["profileSlug"] | null;
    createdAt: RecipeComment["createdAt"];
    updatedAt: RecipeComment["updatedAt"];
  }[];
}) => {
  const actor = useActor(`comments-${slug}`, () =>
    createRecipeCommentsMachine(
      {
        slug,
        comments: initialComments,
      },
      {
        postComment,
      }
    )
  );
  return (
    <RecipeCommentsContext.Provider value={actor}>
      {children}
    </RecipeCommentsContext.Provider>
  );
};

export const RecipeCommentsEmpty = ({ children }: { children: ReactNode }) => {
  const actor = useContext(RecipeCommentsContext);
  const hasComments = useSelector(actor, selectHasComments);
  return !hasComments ? <>{children}</> : <></>;
};

export const RecipeCommentsContent = ({
  children,
}: {
  children: ReactNode;
}) => {
  const actor = useContext(RecipeCommentsContext);
  const hasComments = useSelector(actor, selectHasComments);
  return hasComments ? <>{children}</> : <></>;
};

export const RecipeCommentsItems = () => {
  const actor = useContext(RecipeCommentsContext);
  const comments = useSelector(actor, selectComments);
  return (
    <>
      {comments.map(({ id }, index) => {
        return <RecipeCommentItem key={id} index={index} />;
      })}
    </>
  );

  // return <>{comments.map((coment) => {
  //   return <>})}</>
};

export const RecipeCommentItem = ({ index }: { index: number }) => {
  const actor = useContext(RecipeCommentsContext);
  const selectCommentAtIndex = useCallback(
    (state: RecipeCommentsSnapshot) => {
      return state.context.comments[index];
    },
    [index]
  );
  const item = useSelector(actor, selectCommentAtIndex);
  if (!item) {
    // warn?
    return;
  }

  return (
    <div className="flex items-start space-x-4">
      <Avatar className="w-8 h-8">
        <RobotAvatarImage alt="foo1" />
      </Avatar>
      <div className="flex-1 grid gap-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            @{item.authorSlug || "ChefAnonymous"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            15 minutes ago
          </div>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200">
          {item.comment}
        </p>
      </div>
    </div>
  );
};
