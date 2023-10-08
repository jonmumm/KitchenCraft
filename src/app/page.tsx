import { RecentRecipes } from "@/components/recent-recipes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Header } from "./header";

export default async function Home() {
  return (
    <div className="max-w-2xl mx-auto">
      <Header />
      <div className="flex flex-col flex-end">
        <Link href="/new" className="mx-3">
          <Button className="w-full">🧪 Craft New Recipe</Button>
        </Link>

        <RecentRecipes />

        <Link href="/new" className="m-3 mb-16">
          <Button className="w-full">🧪 Craft New Recipe</Button>
        </Link>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
