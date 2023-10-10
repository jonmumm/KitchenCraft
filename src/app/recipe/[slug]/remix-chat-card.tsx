import { RecipeChatContext } from "@/context/recipe-chat";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSelector } from "@/hooks/useSelector";
import { ShuffleIcon } from "lucide-react";
import { Suspense, useContext } from "react";

export async function RemixChatCard() {
  return (
    <Card className="mx-3">
      <form className="flex flex-col items-center">
        <div className="flex fex-row gap-2 items-center justify-between w-full p-4">
          <Label className="font-semibold uppercase text-xs">Remix</Label>
          <ShuffleIcon />
        </div>
        <Separator />
        <div className="p-3 w-full">
          <div className="flex flex-col gap-2 items-start justify-centerj">
            <div className="flex flex-col w-full gap-2 items-center">
              <Textarea
                placeholder="e.g. Can I use oil instead of butter? Shallots instead of onions?"
                className="w-full"
                name="prompt"
              />
              <div className="w-full flex flex-col gap-2">
                <Label className="uppercase font-semibold text-xs text-secondary-foreground">
                  Suggestions
                </Label>
                <Suspense fallback={<Skeleton className="w-full h-16" />}>
                  <SuggestedModifications />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}

export async function SuggestedModifications() {
  //   const data = await fetch(`/api/recipe/${slug}/modifications`);
  //   console.log({ data });

  return (
    <div className="flex flex-row gap-2 flex-wrap">
      <Badge>Adapt for instant pot</Badge>
      <Badge>Use butter instead of oil</Badge>
    </div>
  );
}
