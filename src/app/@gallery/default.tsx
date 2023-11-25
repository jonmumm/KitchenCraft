import { MediaViewer } from "./components";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return <MediaViewer />;
}
