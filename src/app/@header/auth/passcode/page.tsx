import { TypeLogo } from "@/components/logo";

export default async function Default() {
  return (
    <div className={`flex flex-col h-full justify-center p-4`}>
      <TypeLogo className="h-20 crafting:hidden" />
    </div>
  );
}
