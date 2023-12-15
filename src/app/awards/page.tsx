import React, { ReactNode, Suspense } from "react";
import awardList from "../../data/awards.json";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { slugToSentence } from "@/lib/utils";
import { Badge } from "@/components/display/badge";
import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Card } from "@/components/display/card";

export default function Page() {
  return (
    <>
      <div className="flex flex-col gap-3 max-w-2xl mx-auto justify-center">
        <Suspense fallback={<AwardListLoading itemCount={awardList.length} />}>
          <AwardCarousel />
        </Suspense>
      </div>
    </>
  );
}

function AwardCarousel() {
  const itemCount = awardList.length;

  return (
    <div className="carousel carousel-center space-x-2 pl-2 pr-8">
      {awardList.map((awardData) => {
        return (
          <Card
            key={awardData.name}
            className="carousel-item flex flex-col gap-2 w-56 h-56 justify-between"
          >
            <div className="flex flex-col gap-2 p-3 justify-start flex-1">
              <h3 className="flex flex-row gap-2 font-semibold">
                <span>{awardData.emoji}</span>
                <span>{awardData.name}</span>
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {awardData.description}
              </p>
              <div className="flex-1 flex items-center">
                <div className="flex flex-row gap-3 items-center justify-start w-full rounded-lg bg-slate-100 dark:bg-slate-900">
                  <div className="flex flex-col gap-2 items-center justify-center">
                    <Avatar className="rounded-md w-16 h-16 p-4 bg-slate-50 dark:bg-slate-800 rounded-r-none">
                      <AvatarFallback>
                        <ChefHatIcon />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col gap-2 justify-evenly items-start">
                    <span className="text-sm font-semibold">+2700 🧪</span>
                    <Badge variant="outline" className="flex flex-row gap-1">
                      <ChefHatIcon size={16} /> <span>inspectorT</span>
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-2 wrap items-end">
                {awardData.tags.map((tag) => {
                  return (
                    <Link href={`/tag/${tag}`} key={tag}>
                      <Badge variant="secondary" className="text-xs">
                        {slugToSentence(tag)}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AwardListLoading({ itemCount }: { itemCount: number }) {
  return <></>;
}
