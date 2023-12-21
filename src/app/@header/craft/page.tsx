import { Header } from "../components";

export default async function Page(props: {
  params: { slug: string };
  searchParams: { prompt: string };
}) {
  return <Header backUrl={"/"} />;
}
