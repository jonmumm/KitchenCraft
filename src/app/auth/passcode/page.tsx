import { Header } from "@/app/header";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PasscodeForm } from "./components.client";

export default async function Page() {
  const session = await getSession();
  if (session) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4">
      <Header />
      <section>
        <h1 className="font-semibold text-xl">Check Your Email</h1>
        <PasscodeForm />
      </section>
    </div>
  );
}
