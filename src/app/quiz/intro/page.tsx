"use client";

import { Button } from "@/components/input/button";
import AnimatedText from "@/components/typography/animated-text";
import Delay from "@/components/util/delay";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const Intro: React.FC = () => {
  // const [showButton, setShowButton] = useState(false);
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
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-6">
        <AnimatedText
          text="Craft your ultimate recipe library."
          baseSpeed={60}
          punctDelay={600}
          delay={0}
        />
      </h2>
      <Delay delay={500}>
        <div className="text-lg mb-4">
          <AnimatedText
            text="Hi there! We’re thrilled to help you craft a library of recipes that suit your unique cooking style. This quick quiz will help us understand your preferences and tastes."
            baseSpeed={50}
            punctDelay={300}
            delay={2750}
          />
        </div>
      </Delay>
      <Delay delay={5500}>
        <div className="text-lg mb-4">
          <AnimatedText
            text="The quiz is brief with just 20 questions. Your responses will allow us to create a chef profile for you and offer personalized recipe recommendations. Ready to begin?"
            baseSpeed={35}
            punctDelay={600}
            delay={6250}
          />
        </div>
      </Delay>
      <Delay delay={10000}>
        <Button
          className="mt-2 w-full"
          size="xl"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? (
            <>
              Loading <Loader2Icon className="ml-1 animate-spin" />
            </>
          ) : (
            <>Start Quiz</>
          )}
        </Button>
      </Delay>
    </div>
  );
};

export default Intro;
