import { ProfileSlugSchema } from "@/schema";
import { Header } from "../header";

export default async function Page(props: { params: { slug: string } }) {
  const slug = decodeURIComponent(props.params.slug);
  console.log({ slug });

  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (profileParse.success) {
    return (
      <>
        <Header />
        <h1>Chef ${profileParse.data}</h1>
      </>
    );
  }

  return <div>Not Found</div>;

  // switch (true) {
  //   case slug.startsWith("@"):
  //     const chefSlug = slug;
  //     return
  // }
  // const supabase = createClient(cookies());
}
