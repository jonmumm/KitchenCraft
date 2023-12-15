import { getCurrentUserId } from "@/lib/auth/session";
import { Footer } from "../components";
import { getProfileBySlug } from "@/db/queries";
import { ProfileSlugSchema } from "@/schema";

export default async function Page(props: { params: { slug: string } }) {
  const slug = decodeURIComponent(props.params.slug);
  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (!profileParse.success) {
    return <Footer currentTab={null} />;
  }

  const profileSlug = profileParse.data.slice(1);
  const [currentUserId, profile] = await Promise.all([
    getCurrentUserId(),
    getProfileBySlug(profileSlug),
  ]);
  console.log(currentUserId, profile?.userId, slug, profile);
  return (
    <Footer currentTab={currentUserId === profile?.userId ? "profile" : null} />
  );
}
