import { getSessionActorClient } from "@/lib/auth/session";
import { getSessionId } from "@/lib/session";
import { assert } from "@/lib/utils";
import { QuizBanner } from "./components";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sessionActorClient = await getSessionActorClient();
  const sessionId = await getSessionId();
  const { snapshot } = await sessionActorClient.get(sessionId, {});
  assert(snapshot, "expected snapshot");

  const hasStartedQuiz = snapshot.value.Onboarding !== "NotStarted";
  return <QuizBanner hasStartedQuiz={hasStartedQuiz} />;
}
