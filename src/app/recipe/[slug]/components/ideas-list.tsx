import { AxeIcon, ChevronsRightIcon } from "lucide-react";
import { IdeaListItemCard } from "./idea-list-item-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export async function IdeasList(props: { slug: string }) {
  const resp = await getModifications(props.slug);

  const text = await resp.text();
  if (!text) {
    throw Error("body is empty");
  }
  const items = text.split("\n").filter((item) => item !== "");

  return (
    <ul className="flex flex-row gap-2 flex-wrap">
      {items.map((item) => {
        const [name, description] = item.split(": ");
        return (
          <IdeaListItemCard
            key={item}
            className="w-full flex flex-row gap-2 items-center justify-between p-3 cursor-pointer"
            name={name}
            description={description}
          >
            <div className="flex flex-col gap-1 items-start text-left">
              <span className="font-semibold text-md">{name}</span>
              <span className="font-medium text-sm text-muted-foreground">
                {description}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <div className="w-12 h-12 flex items-center justify-center text-xl border rounded-md border-solid border-slate-200">
                <AxeIcon />
              </div>
              <Label className="uppercase text-xs text-center font-semibold w-full text-green-700">
                Craft
              </Label>
            </div>
          </IdeaListItemCard>
        );
      })}
    </ul>
  );
}

async function getModifications(slug: string) {
  const API_HOST = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : `http://0.0.0.0:3000`;
  return await fetch(`${API_HOST}/api/recipe/${slug}/modifications`);
}
