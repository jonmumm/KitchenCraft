"use client";

import { RecipeChatContext } from "@/components/recipe-chat";
import { useSelector } from "@/hooks/useSelector";
import { useRouter } from "next/navigation";
import { ReactNode, useContext, useLayoutEffect } from "react";

export default function Navigator(props: { children: ReactNode }) {
  const router = useRouter();
  const actor = useContext(RecipeChatContext);

  const slug = useSelector(actor, (state) => state.context.slug);

  useLayoutEffect(() => {
    if (slug) {
      router.push(`/recipe/${slug}`);
    }
  }, [slug, router]);

  return <>{props.children}</>;
}
