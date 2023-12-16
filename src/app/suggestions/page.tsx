import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Command, CommandInput, CommandItem } from "@/components/input/command";
import { redirect } from "next/navigation";
import { z } from "zod";

export default async function Page(props: {
  searchParams: Record<string, string>;
}) {
  const promptParse = z.string().min(1).safeParse(props.searchParams["prompt"]);
  if (!promptParse.success) {
    redirect("/");
  }

  const items = new Array(6).fill(0);

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-2 px-4">
      {items.map((_, index) => {
        return (
          <CommandItem key={index}>
            <Card className="w-full flex flex-row gap-2 items-center px-7">
              <Avatar className="opacity-20">
                <AvatarFallback>{index + 1}.</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 px-4 py-4 w-full sm:flex-row">
                <div className="sm:basis-96">
                  <Skeleton className="w-2/3 sm:w-full h-7" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-full h-5" />
                </div>
              </div>
              <Badge className="opacity-20">Craft</Badge>
            </Card>
          </CommandItem>
        );
      })}
    </div>
  );
}
