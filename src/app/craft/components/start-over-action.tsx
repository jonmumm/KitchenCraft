"use client";

import { Button } from "@/components/ui/button";
import { CommandItem } from "@/components/ui/command";
import { Redo2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const StartOverAction = () => {
  const router = useRouter();
  const handleSelect = useCallback(() => {
    console.log("select");
    router.push("/craft?ac=");
  }, [router]);
  return (
    <CommandItem onSelect={handleSelect} className="flex justify-center py-4">
      <Link href="/craft">
        <Button variant="outline" className="flex flex-row gap-1 items-center">
          <Redo2Icon size={16} />
          <span>Start Over</span>
        </Button>
      </Link>
    </CommandItem>
  );
};
