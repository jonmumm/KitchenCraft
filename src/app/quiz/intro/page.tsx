"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/quiz/experience");
    }, 3500); // Delay for the animation
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <h1 className="text-4xl font-bold mb-8">Intro</h1>
      <p className="text-sm mt-4 px-4">
        Welcome to KitchenCraft. Here lets tell you some things.
      </p>
    </div>
  );
}
