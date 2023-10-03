"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ArrowBigLeftIcon, GripVerticalIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RecentRecipes } from "../components/recent-recipes";

export function Header() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <div className="absolute left-0 top-0 w-full flex items-start justify-between p-4 gap-4">
      <div className="sticky">
        <Popover onOpenChange={(open) => setIsPopoverOpen(open)}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <ArrowBigLeftIcon />
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

      <div className="flex-1 flex justify-center">
        <img
          className="h-16"
          src="/Logo_TypeOnly_Black.svg"
          alt="KitchenCraft Logo TextOnly"
        />
      </div>

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
