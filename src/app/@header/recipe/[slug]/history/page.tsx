import { HeaderWithInput } from "../../../components";

export default async function Page(props: {
  params: { slug: string };
  searchParams: { prompt: string };
}) {
  return <HeaderWithInput backUrl={`/recipe/${props.params.slug}`} />;
}
