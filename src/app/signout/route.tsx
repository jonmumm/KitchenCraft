import { REFRESH_TOKEN_COOKEY_KEY } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function GET() {
  cookies().delete(REFRESH_TOKEN_COOKEY_KEY);
  redirect("/");
}
