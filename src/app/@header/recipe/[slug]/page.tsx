import { Header } from "../../components";

export default async function Page(props: { params: { slug: string } }) {
  return <Header showBack={true} />;
}
