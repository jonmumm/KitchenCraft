import { Footer } from "../components";

export default async function Page(props: { params: { slug: string } }) {
  return <Footer currentTab="profile" />;
}
