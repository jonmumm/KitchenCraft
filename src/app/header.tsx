"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { GripVerticalIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RecentRecipes } from "../components/recent-recipes";

export function Header() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <div className="absolute left-0 top-0 w-full flex items-center justify-between p-4 h-16">
      {/* Logo / Branding on the left */}
      <div className="text-xl font-bold text-blue-600">KitchenCraft</div>

      {/* Popover menu on the right */}
      <div className="sticky">
        <Popover onOpenChange={(open) => setIsPopoverOpen(open)}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <GripVerticalIcon
                className={isPopoverOpen ? "transform rotate-90" : ""}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 flex flex-col gap-4 p-3">
            <Link href="/new">
              <Button className="w-full">New Recipe</Button>
            </Link>
            <Separator />
            <RecentRecipes />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
