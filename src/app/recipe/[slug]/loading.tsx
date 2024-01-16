import { RecipeCraftingPlaceholder } from "@/modules/recipe/crafting-placeholder";

type Props = {
  params: { slug: string };
};

export default async function Loading(props: Props) {
  // todo handle loading state for non craftin recipes...
  return <RecipeCraftingPlaceholder />;
}
