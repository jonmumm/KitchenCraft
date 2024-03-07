import { NewRecipeResultsView } from "../../components";

type Props = {
  params: { slug: string };
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Record<string, string>;
  searchParams: Record<string, string>;
}) {
  return (
    <>
      <NewRecipeResultsView />
    </>
  );
}
