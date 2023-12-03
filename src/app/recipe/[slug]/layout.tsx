import { upvote } from "@/actions";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { RecipePropsProvider } from "./context";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const session = await getSession();
  const userId = session?.user.id;

  const requireLogin = async () => {
    "use server";

    redirect("/login");
  };

  return (
    <RecipePropsProvider
      upvote={
        userId
          ? upvote.bind(null, userId).bind(null, params.slug)
          : requireLogin
      }
      slug={params.slug}
    >
      {children}
    </RecipePropsProvider>
  );
}
