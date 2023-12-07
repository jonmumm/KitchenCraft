import { Button } from "@/components/input/button";
import { Header } from "../header";

export default async function Page() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <Header />
      <h1>Join the Chef&apos;s Club</h1>
      <ul className="list-disc pl-6">
        <li>Unlimited recipes.</li>
        <li>No ads.</li>
        <li>Share with 5 friends or family.</li>
      </ul>
      <Button>Upgrade Now</Button>
    </div>
  );
}
