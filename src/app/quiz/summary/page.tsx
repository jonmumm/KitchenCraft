"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Results() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/"); // Assuming "/home" is the path where users will see their personalized recipes
    }, 5000); // Gives users some time to read the message before redirecting
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-full my-20">
      <div className="text-center animate-pulse px-4">
        <h1 className="text-xl font-bold mb-4">
          AI Personalization in Progress
        </h1>
        <p className="text-sm">
          Thank you for sharing your preferences! We&apos;re now tailoring your
          account to ensure you get the most out of KitchenCraft.
        </p>
      </div>
    </div>
  );
}
