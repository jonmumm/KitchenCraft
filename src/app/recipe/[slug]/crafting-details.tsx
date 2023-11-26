import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";

export async function CraftingDetails({ createdAt }: { createdAt: string }) {
  console.log({ createdAt });
  const date = new Date(createdAt);
  console.log({ date });
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);

  return (
    <>
      <Label className="uppercase text-xs font-bold text-accent-foreground">
        Crafted By
      </Label>

      <Link
        href="/chef/InspectorT"
        className="flex flex-row gap-1 items-center"
      >
        <Badge variant="outline">
          <h3 className="font-bold text-xl">
            <div className="flex flex-col gap-1 items-center">
              <div className="flex flex-row gap-1 items-center">
                <ChefHatIcon />
                <span>
                  <span className="underline">InspectorT</span>
                </span>
              </div>
            </div>
          </h3>
        </Badge>{" "}
        <span className="font-bold">(+123 🧪)</span>
      </Link>
      <Label className="text-muted-foreground uppercase text-xs">
        {formattedDate.split(" at ").join(" @ ")}
      </Label>
    </>
  );
}
