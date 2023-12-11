import { Badge } from "@/components/display/badge";
import { TabsList, TabsTrigger } from "@/components/navigation/tabs";
import { sentenceToSlug } from "@/lib/utils";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

export const LeaderboardTabsList = ({}: {}) => {
  return (
    <TabsList className="w-full">
      <TabsTrigger value="season" asChild>
        <Link href="/leaderboard">Season</Link>
      </TabsTrigger>
      <TabsTrigger value="today" asChild>
        <Link href="/leaderboard/today">Today</Link>
      </TabsTrigger>
      <TabsTrigger value="week" asChild>
        <Link href="/leaderboard/week">Week</Link>
      </TabsTrigger>
      <TabsTrigger value="month" asChild>
        <Link href="/leaderboard/month">Month</Link>
      </TabsTrigger>
      <TabsTrigger value="year" asChild>
        <Link href="/leaderboard/year">Year</Link>
      </TabsTrigger>
      <TabsTrigger value="all" asChild>
        <Link href="/leaderboard/all">All</Link>
      </TabsTrigger>
    </TabsList>
  );
};

export const LeaderboardItems = (props: {
  items: { name: string; points: number }[];
}) => {
  return props.items.map((item, index) => (
    <li
      key={index}
      className="flex justify-between items-center border-b border-gray-300 py-2 px-4 gap-3"
    >
      <Link
        href={`/@${sentenceToSlug(item.name)}`}
        className="flex flex-row gap-2"
      >
        <span>{index + 1}.</span>
        <div className="flex-1">
          <Badge className="flex flex-row gap-1" variant="outline">
            <ChefHatIcon size={16} />
            <span>{item.name}</span>
          </Badge>
        </div>
      </Link>
      <span>{item.points} 🧪</span>
    </li>
  ));
};
