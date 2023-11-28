import {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/navigation/tabs";
import Link from "next/link";
import { ReactNode } from "react";
import { Header } from "../header";
import { BestDropdown } from "./components.client";
import LayoutClient, { HomeTabs } from "./layout.client";
import { MyReceiptRecipes } from "./components";
import { Label } from "@/components/display/label";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <LayoutClient>
      <div>
        <Header />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 w-full">
          <Label className="px-4 uppercase font-semibold text-accent-foreground opacity-70 text-xs">
            InspectorT&apos;s Crafts
          </Label>
          <MyRecipes />
        </div>
        <HomeTabs>
          <TabsList className="w-full">
            <TabsTrigger value="hot" asChild>
              <Link href="/">Hot</Link>
            </TabsTrigger>
            <TabsTrigger value="recent" asChild>
              <Link href="/recent">Recent</Link>
            </TabsTrigger>
            <TabsTrigger value="best" asChild>
              <Link href="/best" className="flex flex-row gap-2">
                <span>Best</span>
                <BestDropdown />
              </Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hot">{children}</TabsContent>
          <TabsContent value="recent">{children}</TabsContent>
          <TabsContent value="best">{children}</TabsContent>
        </HomeTabs>
      </div>
    </LayoutClient>
  );
}

const MyRecipes = () => {
  return (
    <div className="carousel carousel-center space-x-2 px-4">
      <MyReceiptRecipes />
    </div>
  );
};
