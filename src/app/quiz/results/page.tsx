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
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center animate-pulse">
        <h1 className="text-4xl font-bold mb-4">
          Personalizing Your KitchenCraft Experience
        </h1>
        <p className="text-lg">
          Thank you for sharing your preferences! We&apos;re now tailoring your
          account to ensure you get the most out of KitchenCraft.
        </p>
      </div>
      <p className="text-sm mt-4">
        Preparing your personalized recommendations...
      </p>
    </div>
  );
}
