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
    router.prefetch("/quiz/experience");
  }, [router]);

  const handleStart = useCallback(() => {
    setLoading(true);
    router.push("/quiz/experience");
  }, [router]);

  return (
    <>
      <div className="flex flex-col justify-center h-full max-w-xl mx-4 md:mx-auto p-4 rounded-xl bg-purple-600 prose">
        <h2 className="text-2xl font-semibold mb-6 leading-10">
          <AnimatedText
            text="Welcome to KitchenCraft!"
            baseSpeed={60}
            punctDelay={600}
            delay={0}
          />
        </h2>
        <h2 className="text-2xl font-semibold mb-6 leading-7">
          <AnimatedText
            text="Craft your ultimate recipe library."
            baseSpeed={60}
            punctDelay={600}
            delay={1250}
          />
        </h2>
        <div className="text-lg mb-4 font-semibold leading-7">
          <AnimatedText
            text="We’re thrilled to help you craft a library of recipes that suit your unique cooking needs. This quick quiz will help us understand your preferences and tastes."
            baseSpeed={50}
            punctDelay={300}
            delay={2750}
          />
        </div>
        <div className="text-lg font-semibold">
          <AnimatedText
            text="The quiz is brief—only 2 minutes. Your responses will allow us to create a chef profile for you and offer personalized recipe recommendations. Ready to begin?"
            baseSpeed={35}
            punctDelay={400}
            delay={6250}
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
    </>
  );
};

export default Intro;
