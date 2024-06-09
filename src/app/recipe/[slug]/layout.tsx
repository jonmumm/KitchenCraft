import { getNextAuthSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { upvoteBySlug } from "../actions";
import { RecipePropsProvider } from "../context";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const session = await getNextAuthSession();
  const userId = session?.user.id;

  const requireLogin = async () => {
    "use server";

    redirect("/auth/signin");
  };

  return (
    <RecipePropsProvider
      upvote={
        userId
          ? upvoteBySlug.bind(null, userId).bind(null, params.slug)
          : requireLogin
      }
      slug={params.slug}
    >
      {children}
    </RecipePropsProvider>
  );
}
