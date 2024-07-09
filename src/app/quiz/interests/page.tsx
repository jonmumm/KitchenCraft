"use client";
import { PageSessionSnapshot } from "@/app/page-session-machine";
import { Badge } from "@/components/display/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { INTERESTS_INPUT_KEY } from "@/constants/inputs";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelectChoiceEventHandler } from "@/hooks/useSelectChoiceEventHandler";
import { useSend } from "@/hooks/useSend";
import { useStore } from "@nanostores/react";
import { atom, computed } from "nanostores";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Results() {
  const store = usePageSessionStore();
  const [selectedInterests$] = useState(
    atom<string[]>(store.get().context.userSnapshot?.context.interests || [])
  );
  const selectedCount = useStore(
    computed(selectedInterests$, (interests) => interests.length)
  );
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const send = useSend();

  useEffect(() => {
    router.prefetch("/"); // Replace with your actual next page route
  }, [router]);

  const handleContinue = () => {
    send({ type: "SUBMIT", name: INTERESTS_INPUT_KEY });
    router.push("/"); // Replace with your actual next page route
    setLoading(true);
  };

  const SuggestedInterests = () => {
    const items = new Array(20).fill(0);

    useSelectChoiceEventHandler(INTERESTS_INPUT_KEY, (event) => {
      const prev = selectedInterests$.get();
      const goal = event.value;
      let newValue;
      if (prev.includes(goal)) {
        newValue = prev.filter((g) => g !== goal);
      } else {
        newValue = [...prev, goal];
      }
      selectedInterests$.set(newValue);
    });

    const Item = (props: { index: number }) => {
      const selectInterest = useMemo(() => {
        return (state: PageSessionSnapshot) => {
          return state.context.userSnapshot?.context.suggestedFeedTopics?.[
            props.index
          ];
        };
      }, [props.index]);
      const interest = usePageSessionSelector(selectInterest);
      const isSelected$ = computed(selectedInterests$, (selectedInterests) => {
        return !!interest && selectedInterests.includes(interest);
      });
      const isSelected = useStore(isSelected$);

      return interest ? (
        <Badge
          event={{
            type: "SELECT_CHOICE",
            name: INTERESTS_INPUT_KEY,
            value: interest,
            index: props.index,
          }}
          variant={!isSelected ? "outline" : "default"}
        >
          {interest}
        </Badge>
      ) : (
        <Skeleton medianWidth="w-16" className="h-6" />
      );
    };

    return (
      <div className="flex flex-row gap-2 flex-wrap">
        {items.map((_, index) => (
          <Item key={index} index={index} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-4 mb-8">
      <div className="px-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Choose some interests to personalize your daily feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SuggestedInterests />
          </CardContent>
        </Card>
      </div>
      <div className="sticky bottom-0 w-full p-2">
        <Button
          size="xl"
          className="w-full"
          onClick={handleContinue}
          disabled={loading || selectedCount < 3}
        >
          {!loading ? "Continue" : "Loading..."}
        </Button>
      </div>
    </div>
  );
}
