import { HeaderLoading } from "@/app/header";

export default async function Loading() {
  return (
    <div className="max-w-7xl mx-auto w-full">
      <HeaderLoading showBack={true} />
    </div>
  );
}
