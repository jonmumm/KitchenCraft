import { HeaderLoading } from "@/app/header";

export default async function Loading() {
  return (
    <div className="max-w-3xl mx-auto w-full">
      <HeaderLoading showBack={true} />
    </div>
  );
}
