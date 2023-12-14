import { Card } from "@/components/display/card";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { MainMenu } from "@/components/modules/main-menu";
import { ChefHatIcon, GripVerticalIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

export default async function Footer() {
  console.log("footer");
  return (
    <Card className="fixed z-50 bottom-0 left-0 right-0 shadow-inner flex rounded-b-none">
      <div className="flex flex-row gap-2 justify-center p-4 w-full">
        <Link href="/" className="basis-32">
          <Card className="flex flex-col items-center justify-center border-none py-2">
            <SearchIcon />
            <span className="text-xs text-muted-foreground">Explore</span>
          </Card>
        </Link>
        <Link href="/@inspectorT" className="basis-32">
          <Card className="flex flex-col items-center justify-center border-none py-2">
            <ChefHatIcon />
            <span className="text-xs text-muted-foreground">@InspectorT</span>
          </Card>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Card className="flex flex-col items-center justify-center border-none basis-32 py-2">
              <GripVerticalIcon />
              <span className="text-xs text-muted-foreground">Menu</span>
            </Card>
          </SheetTrigger>
          <SheetOverlay />
          <SheetContent side="left" className="w-80 flex flex-col gap-4 p-3">
            <MainMenu />
          </SheetContent>
        </Sheet>
      </div>
    </Card>
  );
}
