import { Label } from "@/components/ui/label";
import { DnaIcon, LightbulbIcon } from "lucide-react";

export async function IdeasHeader() {
  return (
    <div className="flex fex-row gap-2 items-center justify-between w-full p-4">
      <Label className="font-semibold uppercase text-xs">Variations</Label>
      <DnaIcon />
    </div>
  );
}
