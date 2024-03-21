import { TypeLogo } from "@/components/logo";
import { CraftCTA } from "./components";

export default async function Page({}) {
  return (
    <>
      <div className="max-w-3xl mx-auto w-full h-[50vh] crafting:h-auto">
        <div className={`flex flex-col h-full justify-between p-4`}>
          <TypeLogo className="h-20 crafting:hidden" />
          <div className="flex flex-col gap-1 w-full crafting:max-w-3xl crafting:mx-auto">
            <h2 className="text-2xl font-medium crafting:hidden">What&apos;s for dinner?</h2>
            <p className="crafting:hidden text-muted-foreground text-sm mb-2">
              ⚡️ Instantly create personalized recipes.
            </p>
            <CraftCTA />
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
