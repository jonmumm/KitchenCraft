"use client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"; // import plugin
dayjs.extend(relativeTime);

import { RobotAvatarImage } from "@/components/display/avatar";
import { Textarea } from "@/components/input/textarea";
import { useActor } from "@/hooks/useActor";
import { useSelector } from "@/hooks/useSelector";
import { Profile, RecipeComment } from "@/types";
import { Avatar } from "@radix-ui/react-avatar";
import { ReactNode, createContext, useContext, useMemo } from "react";
import { Actions } from "./actions";
import { RecipeCommentsActor, createRecipeCommentsMachine } from "./machine";
import {
  createSelectCommentAtIndex,
  selectComments,
  selectHasComments,
  selectNewComment,
} from "./selectors";
import { NEW_COMMENT_INPUT_KEY } from "@/constants/inputs";

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
  const selectCommentAtIndex = useMemo(
    () => createSelectCommentAtIndex(index),
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
        <RobotAvatarImage alt={item.authorSlug || "ChefAnonymous"} />
      </Avatar>
      <div className="flex-1 grid gap-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            @{item.authorSlug || "ChefAnonymous"}
          </div>
          <div
            className="text-xs text-gray-500 dark:text-gray-400"
            suppressHydrationWarning
          >
            {dayjs(item.createdAt).fromNow()}
          </div>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200">
          {item.comment}
        </p>
      </div>
    </div>
  );
};

export const RecipeCommentsTexarea = () => {
  const actor = useContext(RecipeCommentsContext);
  const newComment = useSelector(actor, selectNewComment);
  return (
    <Textarea
      sendChange
      value={newComment}
      name={NEW_COMMENT_INPUT_KEY}
      className="w-full h-20 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
      placeholder="Add a comment..."
    />
  );
};
