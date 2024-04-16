import { TypeLogo } from "@/components/logo";
import Link from "next/link";

export default async function Default() {
  return (
    <Link href="/" className={`flex flex-col h-full justify-center p-4`}>
      <TypeLogo className="h-20 crafting:hidden" />
    </Link>
  );
}
