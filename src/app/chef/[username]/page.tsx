import { Header } from "@/app/header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChefHatIcon, ScrollTextIcon } from "lucide-react";
import { RecentCard } from "./recent-card";

type Props = {
  params: { username: string };
};

export default async function Page({ params }: Props) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      <Header />

      <div className="px-4 w-full flex flex-col gap-4">
        <Card className="py-3 w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-1 items-center px-2">
              <div className="px-4">
                <ChefHatIcon />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="underline font-bold text-xl">
                  {params.username}
                </h1>
                <span className="font-medium text-sm">(+123 🧪)</span>
              </div>
            </div>
            <Separator />
          </div>
        </Card>
        <RecentCard />
      </div>
    </div>
  );
}
