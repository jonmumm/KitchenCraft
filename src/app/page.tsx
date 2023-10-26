import { Button } from "@/components/ui/button";
import FloatingHeader from "@/components/ui/floating-header";
import { AxeIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "./header";
import { RecentRecipes } from "@/components/recent-recipes";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <Header />
      <FloatingHeader>
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
        <Link href="/craft">
          <Button variant="outline">
            <AxeIcon />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline">
            <AxeIcon />
          </Button>
        </Link>
      </FloatingHeader>
      <div className="flex flex-col flex-end">
        <RecentRecipes />
      </div>
      {/* <Footer /> */}
    </div>
  );
}
