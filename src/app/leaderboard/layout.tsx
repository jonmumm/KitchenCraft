import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { slugToSentence } from "@/lib/utils";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import awardList from "../../data/awards.json";
import { Header } from "../header";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="max-w-2xl mx-auto">
        <Header />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 w-full p-4">
          <Card className="flex flex-col pb-1 w-full max-w-2xl mx-auto">
            <div className="flex flex-row gap-2 items-center w-full px-6">
              <div className="flex flex-col gap-2 my-6 flex-1">
                <Label className="uppercase font-semibold text-accent-foreground opacity-70 text-xs">
                  Awards
                </Label>
                <p className="text-xs text-muted-foreground">
                  Chefs who&apos;ve scored the most points over the past week.
                </p>
              </div>
              <Link href={`/awards`}>
                <Badge variant="outline">View All ⇨</Badge>
              </Link>
            </div>
            <div className="relative h-60">
              <div className="absolute w-screen left-1/2 transform -translate-x-1/2 h-60 flex justify-center z-20">
                <AwardCarousel />
              </div>
            </div>
          </Card>
        </div>
        {children}
      </div>
    </>
  );
}

function AwardCarousel() {
  // Simulate an asynchronous data fetching operation
  // const awards = await fetchAwardsAsync();
  const itemCount = awardList.length;

  const AwardList = async () => {
    return (
      <>
        {awardList.map((awardData) => {
          return (
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
                  <Badge className="text-xl">+2700 🧪</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </>
    );
  };

  return (
    <>
      <div className="carousel carousel-center space-x-2 pl-2 pr-8">
        <Suspense fallback={<AwardListLoading itemCount={itemCount} />}>
          <AwardList />
        </Suspense>
      </div>
    </>
  );
}

const AwardListLoading = ({ itemCount }: { itemCount: number }) => {
  return <></>;
};
