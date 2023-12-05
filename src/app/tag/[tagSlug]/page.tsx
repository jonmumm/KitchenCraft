import { Header } from "@/app/header";
import { slugToSentence } from "@/lib/utils";

export default async function Page(props: { params: { tagSlug: string } }) {
  const tag = slugToSentence(props.params.tagSlug);

  return (
    <>
      <Header />
      <h1>{tag}</h1>
    </>
  );
}
