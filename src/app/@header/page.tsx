import { Button } from "@/components/input/button";
import {
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "@/components/layout/sheet";
import { TypeLogo } from "@/components/logo";
import { getIsMobile } from "@/lib/headers";
import { MenuSheet } from "@/modules/main-menu/menu-sheet";
import { ArrowLeftIcon, GripVerticalIcon } from "lucide-react";
import { MainMenu } from "../menu/components";
import { CraftCTA } from "./components";

export default async function Page({}) {
  return (
    <>
      <div className="max-w-3xl mx-auto w-full h-[50vh] crafting:h-auto relative">
        <div className="hidden lg:block crafting:hidden absolute h-full right-4 top-8">
          <MenuSheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <GripVerticalIcon />
              </Button>
            </SheetTrigger>
            <SheetOverlay />
            <SheetContent side="right" className="p-4">
              <div className="flex flex-col gap-2 py-4">
                <MainMenu />
              </div>
            </SheetContent>
          </MenuSheet>
        </div>
        <div className={`flex flex-col h-full justify-between p-4`}>
          <TypeLogo className="h-20 crafting:hidden" />
          <div className="flex flex-col gap-1 w-full crafting:max-w-3xl crafting:mx-auto">
            <h2 className="text-2xl font-medium crafting:hidden">
              What&apos;s for dinner?
            </h2>
            <p className="crafting:hidden text-muted-foreground text-sm mb-2">
              ⚡️ Instantly create personalized recipes.
            </p>
            <div className="flex flex-row gap-1 items-center">
              <div className="hidden crafting:block">
                <Button variant={"ghost"} event={{ type: "CLOSE" }}>
                  <ArrowLeftIcon />
                </Button>
              </div>
              <CraftCTA initialAutoFocus={!getIsMobile()} />
            </div>
          </div>
          {/* <Link href="/leaderboard" className="hidden lg:block crafting:hidden">
            <Button variant="ghost">
              <TrophyIcon />
            </Button>
          </Link> */}
          {/* <div className="crafting:hidden">
            <MenuSheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <GripVerticalIcon />
                </Button>
              </SheetTrigger>
              <SheetOverlay />
              <SheetContent side="right">
                <div className="flex flex-col gap-2 py-4">
                  <MainMenu />
                </div>
              </SheetContent>
            </MenuSheet>
          </div> */}
          {/* <Card className="flex flex-col items-center justify-center border-none py-2 gap-1 min-w-0">
      </Card> */}
        </div>
      </div>
      {/* <KeyboardToggle /> */}
    </>
  );
}
