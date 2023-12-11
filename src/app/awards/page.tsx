import React, { ReactNode, Suspense } from "react";
import awardList from "../../data/awards.json";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { slugToSentence } from "@/lib/utils";
import { Badge } from "@/components/display/badge";
import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Card } from "@/components/display/card";
import { Header } from "../header";

export default function Page() {
  return (
    <>
      <div className="max-w-2xl mx-auto">
        <Header />
      </div>
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
      {awardList.map((awardData) => (
        <Card
          key={awardData.name}
          className="carousel-item flex flex-col gap-2 w-56 h-48 p-4"
        >
          <h3 className="flex flex-row gap-2 font-semibold">
            <span>{awardData.emoji}</span>
            <span>{awardData.name}</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            {awardData.description}
          </p>
          <div className="flex flex-row gap-2 wrap">
            {awardData.tags.map((tag) => (
              <Link href={`/tag/${tag}`} key={tag}>
                <Badge variant="secondary" className="text-xs">
                  {slugToSentence(tag)}
                </Badge>
              </Link>
            ))}
          </div>
          <div className="flex flex-row gap-2 justify-evenly w-full flex-1">
            <div className="flex flex-col gap-2 items-center justify-center">
              <Avatar className="rounded-md w-16 h-16 p-4 bg-slate-50">
                <AvatarFallback>
                  <ChefHatIcon />
                </AvatarFallback>
              </Avatar>
              <Badge variant="outline" className="flex flex-row gap-1">
                <ChefHatIcon size={16} /> <span>inspectorT</span>
              </Badge>
            </div>
            <div className="font-semibold text-xl flex items-center justify-center">
              +2700 🧪
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AwardListLoading({ itemCount }: { itemCount: number }) {
  return <></>;
}
