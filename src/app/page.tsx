import { ScrollArea } from "@/components/ui/scroll-area";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/new");

  return (
    <ScrollArea>
      <main></main>
    </ScrollArea>
  );
}
