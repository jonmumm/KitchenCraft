import { RecipePrompt } from "@/components/recipe-prompt";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/new");
  // return (
  //   <div className="flex flex-col flex-end flex-1 justify-end pt-16 overflow-hidden">
  //     <RecipePrompt />
  //   </div>
  // );
}
