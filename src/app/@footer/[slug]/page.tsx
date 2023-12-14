import { Footer } from "../components";

const NUM_PLACEHOLDER_RECIPES = 30;

export default async function Page(props: { params: { slug: string } }) {
  return <Footer currentTab="profile" />;
}
