import { MediaViewer } from "./components";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  console.log("hi gallery cefault");
  return <MediaViewer />;
}
