import CraftCommand from "./components";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return <CraftCommand searchParams={searchParams} />;
}
