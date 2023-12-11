import { Tabs, TabsContent } from "@/components/navigation/tabs";
import { LeaderboardItems, LeaderboardTabsList } from "./components";
import { Card } from "@/components/display/card";
import Link from "next/link";
import { Badge } from "@/components/display/badge";
import { ChefHatIcon } from "lucide-react";

// Function to generate random usernames
function generateRandomUsername() {
  const adjectives = [
    "Happy",
    "Clever",
    "Quick",
    "Tasty",
    "Savvy",
    "Adventurous",
  ];
  const nouns = ["Chef", "Cook", "Foodie", "Gourmet", "Cuisine", "Master"];
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

export default async function Page() {
  // Dummy data for the leaderboard (extended to 30 players)
  const leaderboardData = Array.from({ length: 30 }, (_, index) => ({
    name: generateRandomUsername(),
    points: Math.floor(Math.random() * 1000), // Random points between 0 and 999
  }));

  return (
    <Tabs value="season">
      <LeaderboardTabsList />
      <TabsContent value="season" className="p-4">
        <Card>
          <h2 className="text-2xl font-semibold mb-4 p-4">Leaderboard</h2>
          <ul className="mb-4">
            <li className="flex justify-between items-center border-b border-gray-300 py-2 font-semibold p-4">
              <span>Chef</span>
              <span>Points</span>
            </li>
            <LeaderboardItems items={leaderboardData} />
          </ul>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
