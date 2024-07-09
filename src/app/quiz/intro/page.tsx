"use client";

import { Button } from "@/components/input/button";
import AnimatedText from "@/components/typography/animated-text";
import Delay from "@/components/util/delay";
import { ChevronsRightIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const Intro: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/quiz/goals");
  }, [router]);

  const handleStart = useCallback(() => {
    setLoading(true);
    router.push("/quiz/goals");
  }, [router]);

  return (
    <div className="max-w-md mx-auto w-full px-4 flex flex-col gap-4">
      <div className="flex flex-col justify-center h-full md:mx-auto rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 w-full p-4">
        <h2 className="text-2xl font-semibold mb-6 leading-7">
          <AnimatedText
            text="Craft your ultimate recipe library."
            baseSpeed={60}
            punctDelay={600}
            delay={1050}
          />
        </h2>
        <div className="text-lg mb-4 font-semibold leading-7">
          <AnimatedText
            text="Welcome to KitchenCraft AI. We’re thrilled to help you craft a library of recipes that suit your unique cooking needs. This brief quiz will help KitchenCraft understand your goals, preferences and interests."
            baseSpeed={60}
            punctDelay={300}
            delay={2250}
          />
        </div>
        <div className="text-lg font-semibold">
          <AnimatedText
            text="Ready to begin?"
            baseSpeed={35}
            punctDelay={400}
            delay={8250}
          />
        </div>
      </div>
      <Delay delay={9250}>
        <div className="mt-2 max-w-md w-full p-4 mx-auto text-lg font-semibold sticky bottom-4">
          <Button
            className="text-lg font-semibold w-full"
            size="xl"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? (
              <>
                Loading <Loader2Icon className="ml-2 animate-spin" size={16} />
              </>
            ) : (
              <>
                Start Quiz
                <ChevronsRightIcon className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </Delay>
    </div>
  );
};

export default Intro;
