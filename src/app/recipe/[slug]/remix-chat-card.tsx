import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChevronsRightIcon, LightbulbIcon, ShuffleIcon } from "lucide-react";
import { ReactNode, Suspense, useEffect } from "react";

export async function RemixInput() {
  return (
    <Textarea
      placeholder="e.g. Can I use oil instead of butter? Shallots instead of onions?"
      className="w-full"
      name="prompt"
    />
  );
}

export async function RemixContent(props: { children?: ReactNode }) {
  return (
    <div className="p-3 w-full">
      <div className="flex flex-col gap-2 items-start justify-centerj">
        <div className="flex flex-col w-full gap-2 items-center">
          {props.children}
        </div>
      </div>
    </div>
  );
}

export async function RemixHeader() {
  return (
    <div className="flex fex-row gap-2 items-center justify-between w-full p-4">
      <Label className="font-semibold uppercase text-xs">Remix</Label>
      <ShuffleIcon />
    </div>
  );
}

export async function SuggestedModifications(props: { children: ReactNode }) {
  return (
    <div className="flex flex-row gap-2 flex-wrap">
      <Suspense fallback={<Skeleton className="w-full h-6" />}>
        {props.children}
      </Suspense>
    </div>
  );
}

export async function ModificationsList(props: { slug: string }) {
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
          <Card key={item} className="w-full flex flex-row gap-1 items-center justify-between p-4">
            <div className="flex flex-col gap-1 items-start text-left">
              <span className="font-semibold text-md">{name}</span>
              <span className="font-medium text-sm text-muted-foreground">
                {description}
              </span>
            </div>
            <ChevronsRightIcon />
          </Card>
        );
      })}
    </ul>
  );
}

async function getModifications(slug: string) {
  return await fetch(
    `http://0.0.0.0:${process.env.PORT}/api/recipe/${slug}/modifications`
  );
}
