import { Header } from "@/app/header";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getSession();
  const userId = session?.user.id;
  const email = session?.user.email;
  if (!userId || !email) {
    return redirect(`/chefs-club`);
  }

  return (
    <>
      <Header />
      <p>Welcome to the club</p>
    </>
  );
}
