"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/quiz/equipment");
    }, 3000); // Delay for the animation
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center animate-pulse">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to the KitchenCraft Quiz!
        </h1>
        <p className="text-lg">
          You&apos;re about to embark on a personalized journey to discover
          recipes that match your kitchen setup and preferences.
        </p>
      </div>
      <p className="text-sm mt-4">
        Just a moment while we set the stage for your culinary adventure...
      </p>
    </div>
  );
}
