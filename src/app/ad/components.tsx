import { Card } from "@/components/display/card";
import { SkeletonSentence } from "@/components/display/skeleton";
import { randomUUID } from "crypto";

export default async function AdCard() {
  return (
    <Card
      className="flex flex-col gap-3 max-w-2xl w-full mx-auto py-4 rounded-2xl border-none shadow-none sm:border-solid sm:shadow-md sm:hover:shadow-lg"
      eventOnView={{
        type: "VIEW_AD",
        adId: randomUUID(),
      }}
    >
      <SkeletonSentence className="h-8" numWords={4} />
      <SkeletonSentence className="h-5" numWords={12} />
    </Card>
  );
}
