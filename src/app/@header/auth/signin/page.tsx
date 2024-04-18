import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import BasicHeader from "../../components";

export default async function Default() {
  const userId = await getCurrentUserId();
  const profile = userId ? await getProfileByUserId(userId) : undefined;
  return <BasicHeader profile={profile} />;
}
