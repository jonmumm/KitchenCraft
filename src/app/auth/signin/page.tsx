import { Header } from "@/app/header";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SignInForm } from "./components.clients";

export default async function Page() {
  const session = await getSession();
  if (session) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4">
      <Header />
      <section>
        <SignInForm />
      </section>
    </div>
  );
}
