"use client";

import { Button } from "@/components/input/button";
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
      <h2 className="text-2xl semi-bold mt-16">Discover your ideal recipes, personalised to your unique tastes and preferences.</h2>
      <div className="mt-16 max-w-md w-full p-4 mx-auto text-lg font-semibold sticky bottom-4">
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
    </div>
  );
};

export default Intro;
