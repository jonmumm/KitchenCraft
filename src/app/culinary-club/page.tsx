import { Button } from "@/components/input/button";
import { Header } from "../header";

export default async function Page() {
  // get if im part of a club or not...
  // CulinaryClubSchema.parse()
  return (
    <>
      <Header />
      <h1>Join the Club</h1>
      <p>KitchenCraft Culinary Club</p>
      <ul>
        <li>$10 per month</li>
        <li>No advertisements</li>
        <li>Share with 5+ friends/family</li>
        <li>($2 per addtl. member)</li>
      </ul>
      <Button>Upgrade</Button>
    </>
  );
}
