import { PromptSchema } from "@/schema";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export async function RemixForm(props: { children: ReactNode; slug: string }) {
  async function remixAction(data: FormData) {
    "use server";

    const prompt = PromptSchema.parse(data.get("prompt"));
    redirect(
      `/craft?prompt=${encodeURIComponent(prompt)}&remixSrc=${
        props.slug
      }&resultType=remix`
    );
  }

  return (
    <form action={remixAction} className="flex flex-col items-center">
      {props.children}
    </form>
  );
}
