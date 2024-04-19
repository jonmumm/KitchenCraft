import { HeaderWithInput } from "../components";

export default async function Default() {
  // const userId = await getCurrentUserId();
  // const profile = userId ? await getProfileByUserId(userId) : undefined;
  // return <BasicHeader profile={profile} />;
  return <HeaderWithInput />;
}
