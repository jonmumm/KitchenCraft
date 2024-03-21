import { getRefererPath } from "@/lib/headers";
import { Header } from "../../components";

export default async function Page(props: { params: { slug: string } }) {
  const backPath = getRefererPath();
  return <Header backUrl={backPath} />;
}
