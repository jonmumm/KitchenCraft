import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Header } from "../header";

export default async function Page(props: { params: { chefSlug: string } }) {
  const supabase = createClient(cookies());

  return (
    <>
      <Header />
      <h1>{props.params.chefSlug}</h1>
    </>
  );
}
