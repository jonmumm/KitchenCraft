import { getModifications } from "@/lib/api";
import { AxeIcon } from "lucide-react";
import { IdeaListItemCard } from "./idea-list-item-card";

export async function IdeasList(props: { slug: string }) {
  const items = await getModifications(props.slug);

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
            </div>
          </IdeaListItemCard>
        );
      })}
    </ul>
  );
}
