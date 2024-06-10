import { getUserActorClient } from "@/lib/auth/session";
import { getUserId } from "@/lib/session";
import { assert } from "@/lib/utils";
import { QuizBanner } from "./components";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <QuizBanner />;
}
