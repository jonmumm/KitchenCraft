import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRightFromLineIcon,
  BadgeInfoIcon,
  LightbulbIcon,
  SendHorizontalIcon,
  ShuffleIcon,
} from "lucide-react";
import { ReactNode } from "react";

export async function RemixInput() {
  return (
    <>
      <Textarea
        placeholder="e.g. Can I use oil instead of butter? Shallots instead of onions?"
        className="w-full"
        name="prompt"
      />
      <div className="flex flex-row gap-2 w-full">
        <div className="flex flex-row gap-2 text-muted-foreground text-sm items-center">
          <div className="flex justify-center items-center w-16">
            <LightbulbIcon />
          </div>
          <div className="flex flex-row gap-2 flex-wrap">
            <Badge variant="outline">missing ingredients</Badge>
            <Badge variant="outline">measurement conversions</Badge>
            <Badge variant="outline">dietary preferences</Badge>
            <Badge variant="outline">cooking techniques</Badge>
          </div>
          <Button className="w-20 h-full bg-purple-700 rounded-xl">
            <SendHorizontalIcon />
          </Button>
        </div>
      </div>
    </>
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
      <Label className="font-semibold uppercase text-xs">🧪 Remix</Label>
      <ShuffleIcon />
    </div>
  );
}
