import { Footer } from "../components";

export default async function Page(props: { params: { slug: string } }) {
  console.log("leaderboard footer");
  return <Footer currentTab="leaderboard" />;
}
