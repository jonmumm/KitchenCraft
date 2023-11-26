import { RecentRecipes } from "@/components/modules/recent-recipes";
import FloatingHeader from "@/components/layout/floating-header";
import { AxeIcon } from "lucide-react";
import { Header } from "./header";
import { NewRecipeButton } from "./new-recipe-button";

// export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return (
    <>
      <div className="max-w-2xl mx-auto">
        <Header />
        <FloatingHeader>
          <div className="flex flex-row justify-end">
            {/* <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <GripIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 flex flex-col gap-4 p-3">
              <Link href="/new">
                <Button className="w-full">🧪 New</Button>
              </Link>
              <Separator />
              <div className="flex flex-row gap-1 justify-between">
                <p className="text-xs text-center flex-1">
                  Questions or bugs
                  <br />
                  <a
                    className="underline font-semibold"
                    href="mailto:feedback@kitchencraft.ai"
                  >
                    feedback@kitchencraft.ai
                  </a>
                </p>
                <GripIcon />
              </div>
            </PopoverContent>
          </Popover>
          <div> */}
            <NewRecipeButton variant="outline">
              <AxeIcon />
            </NewRecipeButton>
          </div>
        </FloatingHeader>
        <div className="flex flex-col flex-end">
          <RecentRecipes />
        </div>
        {/* <Footer /> */}
      </div>
    </>
  );
}
