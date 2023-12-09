import { ConstructionIcon } from "lucide-react";
import { Header } from "../header";

export default async function Page() {
  return (
    <>
      <Header />
      <div className="max-w-2xl p-4 w-full mx-auto">
        <h1>History</h1>
        <div>
          Under Construction <ConstructionIcon />
        </div>
      </div>
    </>
  );
}
